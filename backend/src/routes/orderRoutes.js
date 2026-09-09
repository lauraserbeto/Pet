const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const authMiddleware = require('../middlewares/authMiddleware');

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

module.exports = router;
