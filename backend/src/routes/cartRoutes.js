const express = require('express');
const router = express.Router();
const CartController = require('../controllers/CartController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  addItemSchema,
  updateItemSchema,
  mergeCartSchema,
  cartItemIdParamsSchema,
} = require('../schemas/cartSchemas');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Retorna o carrinho do usuário (cria vazio se não existe)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrinho com items, totals e warnings
 */
router.get('/', CartController.getCart);

/**
 * @swagger
 * /api/v1/cart/items:
 *   post:
 *     summary: Adiciona um item ao carrinho (ou soma se já existir)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 99
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item já existia, quantidade somada
 *       201:
 *         description: Novo item adicionado
 *       409:
 *         description: Produto indisponível ou limite de SKUs atingido
 */
router.post(
  '/items',
  validate({ body: addItemSchema }),
  CartController.addItem
);

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   patch:
 *     summary: Atualiza a quantidade de um item (quantity=0 remove)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.patch(
  '/items/:itemId',
  validate({ params: cartItemIdParamsSchema, body: updateItemSchema }),
  CartController.updateItem
);

/**
 * @swagger
 * /api/v1/cart/items/{itemId}:
 *   delete:
 *     summary: Remove um item do carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/items/:itemId',
  validate({ params: cartItemIdParamsSchema }),
  CartController.removeItem
);

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: Esvazia o carrinho
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/', CartController.clearCart);

/**
 * @swagger
 * /api/v1/cart/merge:
 *   post:
 *     summary: Funde um carrinho anônimo (localStorage) ao do usuário após login
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 */
router.post(
  '/merge',
  validate({ body: mergeCartSchema }),
  CartController.merge
);

module.exports = router;
