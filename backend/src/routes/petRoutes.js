const express = require('express');
const router = express.Router();
const PetController = require('../controllers/PetController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createPetSchema,
  updatePetSchema,
  petIdParamsSchema,
} = require('../schemas/petSchemas');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/users/me/pets:
 *   get:
 *     summary: Lista os pets do tutor logado
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pets
 */
router.get('/', PetController.listMyPets);

/**
 * @swagger
 * /api/v1/users/me/pets:
 *   post:
 *     summary: Cadastra um novo pet
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Pet criado
 *       409:
 *         description: Limite de pets atingido
 *       422:
 *         description: Dados inválidos
 */
router.post(
  '/',
  validate({ body: createPetSchema }),
  PetController.createPet
);

/**
 * @swagger
 * /api/v1/users/me/pets/{id}:
 *   get:
 *     summary: Detalhes de um pet do tutor logado
 *     tags: [Pets]
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
 *         description: Pet encontrado
 *       404:
 *         description: Pet não encontrado
 */
router.get(
  '/:id',
  validate({ params: petIdParamsSchema }),
  PetController.getPet
);

/**
 * @swagger
 * /api/v1/users/me/pets/{id}:
 *   put:
 *     summary: Atualiza dados do pet
 *     tags: [Pets]
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
 *         description: Pet atualizado
 */
router.put(
  '/:id',
  validate({ params: petIdParamsSchema, body: updatePetSchema }),
  PetController.updatePet
);

/**
 * @swagger
 * /api/v1/users/me/pets/{id}:
 *   delete:
 *     summary: Remove um pet
 *     tags: [Pets]
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
 *         description: Pet removido
 *       409:
 *         description: Pet possui agendamentos ativos
 */
router.delete(
  '/:id',
  validate({ params: petIdParamsSchema }),
  PetController.deletePet
);

module.exports = router;
