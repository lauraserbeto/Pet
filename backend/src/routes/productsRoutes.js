const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/v1/products/options:
 *   get:
 *     summary: Retorna opções de categorias e tipos de produtos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Opções de produtos
 */
router.get('/options', ProductController.getOptions);

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Lista todos os produtos ativos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/', ProductController.listActive);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Detalhes de um produto específico
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do produto
 */
router.get('/:id', ProductController.getDetails);

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/products/provider:
 *   get:
 *     summary: Lista produtos do lojista autenticado
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos do lojista
 */
router.get('/provider', ProductController.listByProvider);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Cadastra um novo produto (Lojista)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Produto criado
 */
router.post('/', ProductController.create);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Atualiza um produto existente (Lojista)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Produto atualizado
 */
router.put('/:id', ProductController.update);

module.exports = router;