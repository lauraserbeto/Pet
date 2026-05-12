const prisma = require('../config/database');
const CartRepository = require('../repositories/CartRepository');
const AppError = require('../utils/AppError');
const {
  MAX_QTY_PER_ITEM,
  MAX_DISTINCT_SKUS,
  CART_EXPIRY_DAYS,
} = require('../schemas/cartSchemas');

const PRODUCT_ACTIVE = 'ACTIVE';

function asNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

/**
 * Transforma o cart bruto do Prisma em um DTO com totais e flags
 * de inconsistência (preço mudou, estoque acabou, etc.).
 */
function toDTO(cart, warnings = []) {
  const items = (cart.items ?? []).map((item) => {
    const unitPrice = asNumber(item.unit_price_snapshot);
    const currentPrice = asNumber(item.product?.price);
    const priceChanged = currentPrice > 0 && currentPrice !== unitPrice;
    return {
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      current_unit_price: currentPrice,
      price_changed: priceChanged,
      line_total: Number((unitPrice * item.quantity).toFixed(2)),
      added_at: item.added_at,
      product: {
        id: item.product.id,
        name: item.product.name,
        image_url: item.product.image_url,
        stock_quantity: item.product.stock_quantity,
        status: item.product.status,
        provider: item.product.provider,
      },
    };
  });

  const subtotal = Number(
    items.reduce((acc, i) => acc + i.line_total, 0).toFixed(2)
  );
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return {
    id: cart.id,
    updated_at: cart.updated_at,
    items,
    totals: {
      subtotal,
      discount: 0,
      total: subtotal,
      total_items: totalItems,
    },
    warnings,
  };
}

function assertProductPurchasable(product) {
  if (!product) throw AppError.notFound('Produto não encontrado');
  if (product.status !== PRODUCT_ACTIVE) {
    throw AppError.conflict(`Produto indisponível (status: ${product.status})`);
  }
  if (product.stock_quantity <= 0) {
    throw AppError.conflict('Produto sem estoque');
  }
}

async function cleanupIfExpired(cart) {
  if (!cart) return cart;
  const expiryMs = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const expired = Date.now() - new Date(cart.updated_at).getTime() > expiryMs;
  if (expired && cart.items?.length > 0) {
    await CartRepository.deleteAllItems(cart.id);
    await CartRepository.touch(cart.id);
    return CartRepository.reloadWithItems(cart.id);
  }
  return cart;
}

class CartController {
  // GET /cart — lazy cleanup se expirado
  async getCart(req, res, next) {
    try {
      const cart = await CartRepository.findOrCreateByUser(req.userId);
      const cleaned = await cleanupIfExpired(cart);
      const warnings = cleaned?.items?.length === 0 && cart.items?.length > 0
        ? [{ code: 'CART_EXPIRED', message: 'Seu carrinho foi limpo por inatividade' }]
        : [];
      return res.status(200).json(toDTO(cleaned, warnings));
    } catch (err) {
      return next(err);
    }
  }

  // POST /cart/items
  async addItem(req, res, next) {
    try {
      const { product_id, quantity } = req.body;
      const warnings = [];

      const product = await prisma.product.findUnique({ where: { id: product_id } });
      assertProductPurchasable(product);

      const cart = await CartRepository.findOrCreateByUser(req.userId);
      const existing = await CartRepository.findItemByProduct(cart.id, product_id);

      const desiredTotal = (existing?.quantity ?? 0) + quantity;
      const cap = Math.min(MAX_QTY_PER_ITEM, product.stock_quantity);
      const finalQty = Math.min(desiredTotal, cap);

      if (finalQty < desiredTotal) {
        warnings.push({
          code: 'STOCK_CAPPED',
          product_id,
          available: cap,
          message: `Quantidade ajustada para ${cap} (estoque disponível)`,
        });
      }

      if (!existing) {
        const distinctCount = await CartRepository.countItems(cart.id);
        if (distinctCount >= MAX_DISTINCT_SKUS) {
          throw AppError.conflict(
            `Limite de ${MAX_DISTINCT_SKUS} itens distintos no carrinho`
          );
        }
        await CartRepository.createItem({
          cart_id: cart.id,
          product_id,
          quantity: finalQty,
          unit_price_snapshot: product.price,
        });
      } else {
        await CartRepository.updateItem(existing.id, {
          quantity: finalQty,
          unit_price_snapshot: product.price,
        });
      }
      await CartRepository.touch(cart.id);

      const reloaded = await CartRepository.reloadWithItems(cart.id);
      return res.status(existing ? 200 : 201).json(toDTO(reloaded, warnings));
    } catch (err) {
      return next(err);
    }
  }

  // PATCH /cart/items/:itemId — quantity 0 remove
  async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const warnings = [];

      const cart = await CartRepository.findOrCreateByUser(req.userId);
      const item = await CartRepository.findItemById(itemId, cart.id);
      if (!item) throw AppError.notFound('Item do carrinho não encontrado');

      if (quantity === 0) {
        await CartRepository.deleteItem(itemId);
      } else {
        const product = await prisma.product.findUnique({ where: { id: item.product_id } });
        assertProductPurchasable(product);

        const cap = Math.min(MAX_QTY_PER_ITEM, product.stock_quantity);
        const finalQty = Math.min(quantity, cap);
        if (finalQty < quantity) {
          warnings.push({
            code: 'STOCK_CAPPED',
            product_id: item.product_id,
            available: cap,
            message: `Quantidade ajustada para ${cap} (estoque disponível)`,
          });
        }
        await CartRepository.updateItem(itemId, { quantity: finalQty });
      }
      await CartRepository.touch(cart.id);

      const reloaded = await CartRepository.reloadWithItems(cart.id);
      return res.status(200).json(toDTO(reloaded, warnings));
    } catch (err) {
      return next(err);
    }
  }

  // DELETE /cart/items/:itemId
  async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const cart = await CartRepository.findOrCreateByUser(req.userId);
      const item = await CartRepository.findItemById(itemId, cart.id);
      if (!item) throw AppError.notFound('Item do carrinho não encontrado');

      await CartRepository.deleteItem(itemId);
      await CartRepository.touch(cart.id);

      const reloaded = await CartRepository.reloadWithItems(cart.id);
      return res.status(200).json(toDTO(reloaded));
    } catch (err) {
      return next(err);
    }
  }

  // DELETE /cart
  async clearCart(req, res, next) {
    try {
      const cart = await CartRepository.findOrCreateByUser(req.userId);
      await CartRepository.deleteAllItems(cart.id);
      await CartRepository.touch(cart.id);
      const reloaded = await CartRepository.reloadWithItems(cart.id);
      return res.status(200).json(toDTO(reloaded));
    } catch (err) {
      return next(err);
    }
  }

  // POST /cart/merge — usado após login para fundir carrinho anônimo
  async merge(req, res, next) {
    try {
      const { items } = req.body;
      const warnings = [];

      const cart = await CartRepository.findOrCreateByUser(req.userId);

      // Pré-busca produtos para minimizar round-trips
      const productIds = [...new Set(items.map((i) => i.product_id))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const incoming of items) {
        const product = productMap.get(incoming.product_id);

        if (!product) {
          warnings.push({
            code: 'PRODUCT_NOT_FOUND',
            product_id: incoming.product_id,
            message: 'Produto removido — ignorado no merge',
          });
          continue;
        }
        if (product.status !== PRODUCT_ACTIVE || product.stock_quantity <= 0) {
          warnings.push({
            code: 'PRODUCT_UNAVAILABLE',
            product_id: incoming.product_id,
            message: 'Produto indisponível — ignorado no merge',
          });
          continue;
        }

        const existing = await CartRepository.findItemByProduct(cart.id, product.id);
        const desired = (existing?.quantity ?? 0) + incoming.quantity;
        const cap = Math.min(MAX_QTY_PER_ITEM, product.stock_quantity);
        const finalQty = Math.min(desired, cap);

        if (finalQty < desired) {
          warnings.push({
            code: 'STOCK_CAPPED',
            product_id: product.id,
            available: cap,
            message: `Quantidade ajustada para ${cap} (estoque disponível)`,
          });
        }

        if (!existing) {
          const distinctCount = await CartRepository.countItems(cart.id);
          if (distinctCount >= MAX_DISTINCT_SKUS) {
            warnings.push({
              code: 'SKU_LIMIT_REACHED',
              product_id: product.id,
              message: `Limite de ${MAX_DISTINCT_SKUS} SKUs atingido`,
            });
            break;
          }
          await CartRepository.createItem({
            cart_id: cart.id,
            product_id: product.id,
            quantity: finalQty,
            unit_price_snapshot: product.price,
          });
        } else {
          await CartRepository.updateItem(existing.id, {
            quantity: finalQty,
            unit_price_snapshot: product.price,
          });
        }
      }
      await CartRepository.touch(cart.id);

      const reloaded = await CartRepository.reloadWithItems(cart.id);
      return res.status(200).json(toDTO(reloaded, warnings));
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new CartController();
