const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/ProviderController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/v1/providers/hotels:
 *   get:
 *     summary: Lista hotéis ativos
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de hotéis
 */
router.get('/hotels', (req, res) => ProviderController.listHotels(req, res));

/**
 * @swagger
 * /api/v1/providers/sitters:
 *   get:
 *     summary: Lista pet sitters ativos
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de pet sitters
 */
router.get('/sitters', (req, res) => ProviderController.listSitters(req, res));

/**
 * @swagger
 * /api/v1/providers/stores:
 *   get:
 *     summary: Lista lojistas ativos/aprovados
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de lojistas
 */
router.get('/stores', (req, res) => ProviderController.listStores(req, res));

/**
 * @swagger
 * /api/v1/providers:
 *   get:
 *     summary: Lista todos os parceiros
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de parceiros
 */
router.get('/', ProviderController.listPartners);

/**
 * @swagger
 * /api/v1/providers/me:
 *   get:
 *     summary: Retorna dados do parceiro logado
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do parceiro
 *       401:
 *         description: Não autorizado
 */
router.get('/me', authMiddleware, ProviderController.getMe);

/**
 * @swagger
 * /api/v1/providers/completeness:
 *   get:
 *     summary: Verifica se o parceiro logado finalizou o cadastro do seu perfil público
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados de completitude
 */
router.get('/completeness', authMiddleware, ProviderController.getCompleteness);

/**
 * @swagger
 * /api/v1/providers/me:
 *   put:
 *     summary: Atualiza dados de conta do parceiro
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Parceiro atualizado
 */
router.put('/me', authMiddleware, ProviderController.updateMe);

/**
 * @swagger
 * /api/v1/providers/profile:
 *   put:
 *     summary: Atualiza dados do perfil público
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Perfil atualizado
 */
router.put('/profile', authMiddleware, ProviderController.updateProfile);

/**
 * @swagger
 * /api/v1/providers/{id}:
 *   get:
 *     summary: Retorna detalhes de um parceiro específico
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do parceiro
 *       404:
 *         description: Parceiro não encontrado
 */
router.get('/:id', ProviderController.getDetails);

/**
 * @swagger
 * /api/v1/providers/{id}/status:
 *   patch:
 *     summary: Atualiza o status de aprovação de um parceiro (Admin)
 *     tags: [Providers]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDENTE, EM_REVISAO, APROVADO, REJEITADO]
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.patch('/:id/status', ProviderController.updateStatus);

module.exports = router;