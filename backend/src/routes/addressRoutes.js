const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/AddressController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/addresses:
 *   get:
 *     summary: Lista todos os endereços do usuário logado
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de endereços
 */
router.get('/', AddressController.getAddresses);

/**
 * @swagger
 * /api/v1/addresses:
 *   post:
 *     summary: Cadastra um novo endereço para o usuário
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cep:
 *                 type: string
 *               street:
 *                 type: string
 *               number:
 *                 type: string
 *               complement:
 *                 type: string
 *               neighborhood:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *     responses:
 *       201:
 *         description: Endereço cadastrado
 */
router.post('/', AddressController.createAddress);

/**
 * @swagger
 * /api/v1/addresses/{id}:
 *   put:
 *     summary: Atualiza um endereço existente
 *     tags: [Addresses]
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
 *     responses:
 *       200:
 *         description: Endereço atualizado
 */
router.put('/:id', AddressController.updateAddress);

/**
 * @swagger
 * /api/v1/addresses/{id}:
 *   delete:
 *     summary: Remove um endereço
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Endereço removido
 */
router.delete('/:id', AddressController.deleteAddress);

module.exports = router;