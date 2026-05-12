const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/FavoriteController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  addFavoriteSchema,
  listFavoritesQuerySchema,
  removeFavoriteParamsSchema,
} = require('../schemas/favoriteSchemas');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/favorites:
 *   get:
 *     summary: Lista os favoritos hidratados do usuário (opcional ?type=)
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PRODUCT, HOTEL, SITTER]
 *     responses:
 *       200:
 *         description: Lista de favoritos com o target embutido
 */
router.get(
  '/',
  validate({ query: listFavoritesQuerySchema }),
  FavoriteController.list
);

/**
 * @swagger
 * /api/v1/favorites/ids:
 *   get:
 *     summary: Lista enxuta (apenas chaves) — usada para hidratar ícones na SPA
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array de { target_type, target_id }
 */
router.get('/ids', FavoriteController.listIds);

/**
 * @swagger
 * /api/v1/favorites:
 *   post:
 *     summary: Marca um item como favorito (idempotente)
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target_type:
 *                 type: string
 *                 enum: [PRODUCT, HOTEL, SITTER]
 *               target_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Já era favorito (retorna o existente)
 *       201:
 *         description: Adicionado
 *       404:
 *         description: Target não encontrado
 */
router.post(
  '/',
  validate({ body: addFavoriteSchema }),
  FavoriteController.add
);

/**
 * @swagger
 * /api/v1/favorites/{type}/{targetId}:
 *   delete:
 *     summary: Remove um favorito
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PRODUCT, HOTEL, SITTER]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Removido
 */
router.delete(
  '/:type/:targetId',
  validate({ params: removeFavoriteParamsSchema }),
  FavoriteController.remove
);

module.exports = router;
