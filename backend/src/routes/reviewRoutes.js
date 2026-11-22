const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewSummary:
 *       type: object
 *       description: Campos adicionados aos registros públicos; os demais campos do produto/parceiro são preservados.
 *       required: [rating_avg, rating_count]
 *       properties:
 *         rating_avg:
 *           type: number
 *           nullable: true
 *           minimum: 1
 *           maximum: 5
 *           description: Média das avaliações de origens concluídas, arredondada a uma casa decimal; null sem avaliações.
 *           example: 4.3
 *         rating_count:
 *           type: integer
 *           minimum: 0
 *           description: Quantidade de avaliações consideradas no agregado.
 *           example: 3
 */

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
 * /api/v1/reviews/summary:
 *   get:
 *     summary: Média, contagem e distribuição completa por nota de um produto ou parceiro
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: provider_id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Exatamente um alvo; distribution contém rating e count de 5 a 1, considerando todas as avaliações válidas.
 *       422:
 *         description: Filtro inválido
 * /api/v1/reviews/mine:
 *   get:
 *     summary: Consulta a avaliação do tutor para uma origem e alvo, sem expor avaliações privadas de outros usuários
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: order_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: provider_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: appointment_id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Objeto review ou null; exige produto/pedido ou parceiro/agendamento.
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Perfil diferente de Tutor
 *       422:
 *         description: Origem e alvo inválidos
 */
router.get('/summary', ReviewController.summary);
router.get('/mine', authMiddleware, ReviewController.mine);

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
 *       422:
 *         description: Transação não concluída ou dados inválidos (nota, alvo ou origem)
 *       403:
 *         description: Perfil diferente de Tutor ou transação pertence a outro usuário
 *       404:
 *         description: Pedido ou agendamento não encontrado
 *       409:
 *         description: Avaliação duplicada para a mesma origem
 */
router.post('/', authMiddleware, ReviewController.create);

module.exports = router;

