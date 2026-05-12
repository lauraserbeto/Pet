const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/AddressController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamsSchema,
} = require('../schemas/addressSchemas');

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
 *         description: Lista de endereços (default primeiro)
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
 *     responses:
 *       201:
 *         description: Endereço cadastrado (1º endereço é definido como default automaticamente)
 *       409:
 *         description: Limite de endereços atingido
 *       422:
 *         description: CEP inválido ou não encontrado
 */
router.post(
  '/',
  validate({ body: createAddressSchema }),
  AddressController.createAddress
);

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
 *           format: uuid
 *     responses:
 *       200:
 *         description: Endereço atualizado
 */
router.put(
  '/:id',
  validate({ params: addressIdParamsSchema, body: updateAddressSchema }),
  AddressController.updateAddress
);

/**
 * @swagger
 * /api/v1/addresses/{id}/default:
 *   patch:
 *     summary: Define este endereço como principal
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Endereço marcado como principal
 */
router.patch(
  '/:id/default',
  validate({ params: addressIdParamsSchema }),
  AddressController.setDefault
);

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
 *           format: uuid
 *     responses:
 *       204:
 *         description: Endereço removido
 *       409:
 *         description: Não pode excluir único endereço com pedidos em andamento
 */
router.delete(
  '/:id',
  validate({ params: addressIdParamsSchema }),
  AddressController.deleteAddress
);

module.exports = router;
