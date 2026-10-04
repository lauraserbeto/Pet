const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { orderIdParamsSchema } = require('../schemas/orderSchemas');

/**
 * @swagger
 * /api/v1/orders/webhook:
 *   post:
 *     summary: Rota reservada para webhook de gateway de pagamento
 *     tags: [Orders]
 *     responses:
 *       501:
 *         description: Gateway real ainda não implementado
 */
router.post('/webhook', OrderController.webhook);

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Cria pedido(s) atomicamente a partir do carrinho do usuário autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Pedido(s) criado(s) com sucesso
 *       400:
 *         description: Carrinho vazio ou inválido
 *       403:
 *         description: Acesso restrito a clientes
 *       409:
 *         description: Estoque insuficiente ou produto indisponível
 */
router.post('/', OrderController.create);

/**
 * @swagger
 * /api/v1/orders/{orderId}/pay:
 *   post:
 *     summary: Confirma pagamento simulado de um pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pedido pago ou pagamento idempotente
 *       403:
 *         description: Acesso restrito a clientes
 *       404:
 *         description: Pedido não encontrado para o usuário autenticado
 *       409:
 *         description: Pedido não está em estado pagável
 */
router.post(
  '/:orderId/pay',
  validate({ params: orderIdParamsSchema }),
  OrderController.pay
);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Lista os pedidos do tutor autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página atual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de pedidos do tutor
 *         headers:
 *           X-Total-Count:
 *             description: Total de registros
 *             schema:
 *               type: integer
 *           X-Page:
 *             description: Página atual
 *             schema:
 *               type: integer
 *           X-Limit:
 *             description: Itens por página
 *             schema:
 *               type: integer
 *           X-Total-Pages:
 *             description: Total de páginas
 *             schema:
 *               type: integer
 *       401:
 *         description: Não autenticado
 */
router.get('/', OrderController.listMine);

/**
 * @swagger
 * /api/v1/orders/received:
 *   get:
 *     summary: Lista os pedidos recebidos pelo parceiro autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Lista de pedidos recebidos
 *         headers:
 *           X-Total-Count:
 *             schema:
 *               type: integer
 *           X-Page:
 *             schema:
 *               type: integer
 *           X-Limit:
 *             schema:
 *               type: integer
 *           X-Total-Pages:
 *             schema:
 *               type: integer
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso restrito a parceiros cadastrados
 */
router.get('/received', OrderController.listReceived);

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um pedido (apenas o parceiro dono)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: Novo status do pedido
 *                 example: PAGO
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (não é o parceiro dono do pedido)
 *       404:
 *         description: Pedido não encontrado
 *       422:
 *         description: Status inválido ou transição não permitida
 */
router.patch('/:id/status', OrderController.updateStatus);

module.exports = router;
