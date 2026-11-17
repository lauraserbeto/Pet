const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Lista avaliações de um produto ou parceiro
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID do produto a filtrar (exclusivo com provider_id)
 *       - in: query
 *         name: provider_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID do parceiro a filtrar (exclusivo com product_id)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de avaliações do alvo
 *       422:
 *         description: Filtro inválido (nenhum ou ambos os alvos informados)
 */
router.get('/', ReviewController.list);

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Cria uma avaliação (tutor autenticado)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 2000
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               provider_id:
 *                 type: string
 *                 format: uuid
 *               order_id:
 *                 type: string
 *                 format: uuid
 *               appointment_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Avaliação criada
 *       400:
 *         description: Transação ainda não concluída
 *       403:
 *         description: Transação pertence a outro usuário
 *       404:
 *         description: Pedido ou agendamento não encontrado
 *       409:
 *         description: Avaliação duplicada para a mesma origem
 *       422:
 *         description: Dados inválidos (rating fora de 1–5, alvo/origem incoerentes)
 */
router.post('/', authMiddleware, ReviewController.create);

module.exports = router;

