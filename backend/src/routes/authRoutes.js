const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const validate = require("../middlewares/validate");
const {
  registerSchema,
  resetPasswordSchema,
} = require("../schemas/authSchemas");

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Cadastra um novo usuário (Tutor ou Parceiro)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password, role_id, terms_accepted, terms_version]
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Uma maiúscula ASCII e um número; no máximo 72 bytes UTF-8. Espaços são preservados.
 *               role_id:
 *                 type: integer
 *               terms_accepted:
 *                 type: boolean
 *                 enum: [true]
 *               terms_version:
 *                 type: string
 *                 description: Deve ser a versão vigente de GET /api/v1/legal/policy, igual ao texto exibido.
 *               document_type:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *               document:
 *                 type: string
 *                 description: CPF para Pet Sitter ou CNPJ numérico/alfanumérico para parceiros; dígitos verificadores válidos. Lojista/Hotel exigem CNPJ.
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *       422:
 *         description: Dados inválidos ou senha fora da política
 *       409:
 *         description: E-mail ou documento já cadastrado
 */
router.post(
  "/register",
  validate({ body: registerSchema }),
  AuthController.register,
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Realiza o login do usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 *       400:
 *         description: Credenciais obrigatórias ausentes
 *       403:
 *         description: Conta desativada ou aprovação obrigatória pendente
 */
router.post("/login", AuthController.login);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Solicita recuperação de senha por e-mail
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instruções enviadas (resposta genérica por segurança)
 *       422:
 *         description: Formato de e-mail inválido
 */
router.post("/forgot-password", AuthController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Redefine a senha usando o token recebido por e-mail
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Uma maiúscula ASCII e um número; no máximo 72 bytes UTF-8. Deve ser diferente da senha atual.
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       400:
 *         description: Token inválido, expirado ou já utilizado
 *       422:
 *         description: Senha repetida ou fora da política
 *       409:
 *         description: Credenciais alteradas durante a operação; solicite outro link
 */
router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  AuthController.resetPassword,
);

module.exports = router;
