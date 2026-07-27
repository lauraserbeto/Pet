const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Tudo sob /api/v1/admin exige token válido E papel de administrador.
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @swagger
 * /api/v1/admin/metrics:
 *   get:
 *     summary: Métricas da plataforma para a Visão Geral do admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30, minimum: 1, maximum: 365 }
 *         description: Janela usada em "novos no período" e no gráfico de crescimento
 *     responses:
 *       200:
 *         description: Contagens de usuários, parceiros, moderação, catálogo e engajamento
 *       403:
 *         description: Usuário não é administrador
 */
router.get('/metrics', AdminController.getMetrics);

module.exports = router;
