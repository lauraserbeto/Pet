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

module.exports = router;
