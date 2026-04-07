const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

/**
 * @swagger
 * /Auth/Register:
 *   post:
 *     summary: Cadastra um novo usuário (Tutor ou Parceiro)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuário cadastrado com sucesso
 *       400:
 *         description: Erro de validação ou e-mail já existente
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /Auth/Login:
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
 */
router.post('/login', AuthController.login);

module.exports = router;