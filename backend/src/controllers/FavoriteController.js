const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const ROLE_HOTEL = 3;
const ROLE_SITTER = 4;

async function assertTargetExists(targetType, targetId) {
  if (targetType === 'PRODUCT') {
    const product = await prisma.product.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!product) throw AppError.notFound('Produto não encontrado');
    return;
  }

  // HOTEL ou SITTER → provider com role correspondente
  const expectedRole = targetType === 'HOTEL' ? ROLE_HOTEL : ROLE_SITTER;
  const provider = await prisma.provider.findUnique({
    where: { id: targetId },
    select: { user: { select: { role_id: true } } },
  });
  if (!provider) throw AppError.notFound('Provedor não encontrado');
  if (provider.user.role_id !== expectedRole) {
    throw AppError.badRequest(
      `Provedor ${targetId} não corresponde ao tipo ${targetType}`
    );
  }
}

async function hydrateTargets(favorites) {
  if (favorites.length === 0) return [];

  const productIds = favorites.filter((f) => f.target_type === 'PRODUCT').map((f) => f.target_id);
  const providerIds = favorites
    .filter((f) => f.target_type === 'HOTEL' || f.target_type === 'SITTER')
    .map((f) => f.target_id);

  const [products, providers] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            price: true,
            image_url: true,
            category: true,
            status: true,
          },
        })
      : [],
    providerIds.length
      ? prisma.provider.findMany({
          where: { id: { in: providerIds } },
          select: {
            id: true,
            business_name: true,
            city: true,
            state: true,
            daily_rate: true,
            hourly_rate: true,
            gallery_images: true,
            user: { select: { avatar_url: true, role_id: true } },
          },
        })
      : [],
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const providerMap = new Map(providers.map((p) => [p.id, p]));

  return favorites
    .map((fav) => {
      const target =
        fav.target_type === 'PRODUCT'
          ? productMap.get(fav.target_id)
          : providerMap.get(fav.target_id);
      if (!target) return null; // dangling — ignora silenciosamente
      return { ...fav, target };
    })
    .filter(Boolean);
}

class FavoriteController {
  // Lista favoritos hidratados; aceita ?type=PRODUCT|HOTEL|SITTER
  async list(req, res, next) {
    try {
      const where = { user_id: req.userId };
      if (req.query.type) where.target_type = req.query.type;

      const favorites = await prisma.favorite.findMany({
        where,
        orderBy: { created_at: 'desc' },
      });

      const hydrated = await hydrateTargets(favorites);
      return res.status(200).json(hydrated);
    } catch (err) {
      return next(err);
    }
  }

  // Versão leve usada para hidratar ícones de favorito ao boot da SPA
  async listIds(req, res, next) {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { user_id: req.userId },
        select: { target_type: true, target_id: true },
      });
      return res.status(200).json(favorites);
    } catch (err) {
      return next(err);
    }
  }

  // Idempotente: se já existe, retorna 200 com o existente.
  async add(req, res, next) {
    try {
      const { target_type, target_id } = req.body;

      await assertTargetExists(target_type, target_id);

      const existing = await prisma.favorite.findUnique({
        where: {
          user_id_target_type_target_id: {
            user_id: req.userId,
            target_type,
            target_id,
          },
        },
      });
      if (existing) {
        return res.status(200).json(existing);
      }

      const created = await prisma.favorite.create({
        data: { user_id: req.userId, target_type, target_id },
      });
      return res.status(201).json(created);
    } catch (err) {
      return next(err);
    }
  }

  // DELETE /favorites/:type/:targetId
  async remove(req, res, next) {
    try {
      const { type, targetId } = req.params;
      const result = await prisma.favorite.deleteMany({
        where: {
          user_id: req.userId,
          target_type: type,
          target_id: targetId,
        },
      });
      if (result.count === 0) {
        throw AppError.notFound('Favorito não encontrado');
      }
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new FavoriteController();
