const prisma = require('../../config/database');
const CartRepository = require('../../repositories/CartRepository');
const ProductRepository = require('../../repositories/ProductRepository');
const AppError = require('../../utils/AppError');
const { ORDER_STATUS } = require('../../constants/orderStatus');

function asNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

function formatOrder(order) {
  return {
    id: order.id,
    provider_id: order.provider_id,
    customer_id: order.customer_id,
    total_price: asNumber(order.total_price),
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    provider: order.provider,
    items: (order.items || []).map((item) => {
      const unitPrice = asNumber(item.unit_price);
      return {
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: Number((unitPrice * item.quantity).toFixed(2)),
        product: item.product,
      };
    }),
  };
}

class CreateOrderUseCase {
  async execute({ userId, userRole }) {
    if (userRole && userRole !== 5) {
      throw AppError.forbidden('Apenas clientes podem realizar pedidos');
    }

    const cart = await CartRepository.findByUser(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw AppError.badRequest('O carrinho está vazio');
    }

    // Validação prévia de disponibilidade e estoque
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        throw AppError.notFound(`Produto com ID ${item.product_id} não encontrado`);
      }
      if (product.status !== 'ACTIVE') {
        throw AppError.conflict(`Produto "${product.name}" indisponível (status: ${product.status})`);
      }
      if (product.stock_quantity < item.quantity) {
        throw AppError.conflict(
          `Estoque insuficiente para o produto "${product.name}"`,
          {
            product_id: item.product_id,
            requested: item.quantity,
            available: product.stock_quantity,
          }
        );
      }
    }

    // Agrupamento por lojista (Opção A: 1 pedido por provider)
    const itemsByProvider = new Map();
    for (const item of cart.items) {
      const providerId = item.product.provider?.id || item.product.provider_id;
      if (!providerId) {
        throw AppError.badRequest(`Produto "${item.product.name}" não está associado a nenhum lojista`);
      }
      if (!itemsByProvider.has(providerId)) {
        itemsByProvider.set(providerId, []);
      }
      itemsByProvider.get(providerId).push(item);
    }

    // Execução da transação atômica única no Prisma
    const createdOrders = await prisma.$transaction(async (tx) => {
      // 1. Revalidação concorrente de estoque dentro da transação e decremento
      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
        });

        if (!product || product.status !== 'ACTIVE') {
          throw AppError.conflict(
            `Produto "${item.product.name}" indisponível no momento da finalização`
          );
        }

        if (product.stock_quantity < item.quantity) {
          throw AppError.conflict(
            `Estoque insuficiente para o produto "${product.name}"`,
            {
              product_id: item.product_id,
              requested: item.quantity,
              available: product.stock_quantity,
            }
          );
        }

        await ProductRepository.decrementStock(item.product_id, item.quantity, tx);
      }

      // 2. Criação dos pedidos e itens por lojista
      const orders = [];
      for (const [providerId, groupItems] of itemsByProvider.entries()) {
        const orderItemsData = groupItems.map((item) => {
          const unitPrice =
            item.unit_price_snapshot !== undefined && item.unit_price_snapshot !== null
              ? asNumber(item.unit_price_snapshot)
              : asNumber(item.product.price);

          return {
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: unitPrice,
          };
        });

        const totalPrice = Number(
          orderItemsData
            .reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0)
            .toFixed(2)
        );

        const order = await tx.order.create({
          data: {
            customer_id: userId,
            provider_id: providerId,
            total_price: totalPrice,
            status: ORDER_STATUS.AWAITING_PAYMENT,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    image_url: true,
                    sku: true,
                  },
                },
              },
            },
            provider: {
              select: {
                id: true,
                business_name: true,
              },
            },
          },
        });

        orders.push(order);
      }

      // 3. Esvaziamento atômico do carrinho
      await CartRepository.deleteAllItems(cart.id, tx);
      await CartRepository.touch(cart.id, tx);

      return orders;
    });

    const formattedOrders = createdOrders.map(formatOrder);

    return {
      order: formattedOrders[0],
      orders: formattedOrders,
    };
  }
}

module.exports = new CreateOrderUseCase();
