const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const {
  updateProfileSchema,
  changePasswordSchema,
} = require('../schemas/userSchemas');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Retorna os dados do perfil logado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
router.get('/me', UserController.getMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Atualiza os dados de perfil (Tutor/Parceiro)
 *     tags: [Users]
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
router.put('/me', validate({ body: updateProfileSchema }), UserController.updateProfile);

/**
 * @swagger
 * /api/v1/users/me/password:
 *   patch:
 *     summary: Atualiza a senha do usuário logado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha atualizada
 */
router.patch(
  '/me/password',
  validate({ body: changePasswordSchema }),
  UserController.updatePassword
);

/**
 * @swagger
 * /api/v1/users/me/evaluations:
 *   post:
 *     summary: Envia uma avaliação de um Pet Sitter (Fluxo Tutor)
 *     tags: [Users]
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
 *         description: Avaliação enviada e aguardando revisão
 */
router.post('/me/evaluations', UserController.submitSitterEvaluation);

/**
 * @swagger
 * /api/v1/users/admin/evaluations:
 *   get:
 *     summary: Lista todas as avaliações pendentes (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de avaliações
 */
router.get('/admin/evaluations', adminMiddleware, UserController.getEvaluations);

/**
 * @swagger
 * /api/v1/users/admin/evaluations/{id}:
 *   patch:
 *     summary: Aprova ou rejeita uma avaliação de parceiro (Admin)
 *     tags: [Admin]
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
 *                 enum: [APROVADO, REJEITADO]
 *     responses:
 *       200:
 *         description: Avaliação revisada
 */
router.patch('/admin/evaluations/:id', adminMiddleware, UserController.reviewEvaluation);

module.exports = router;