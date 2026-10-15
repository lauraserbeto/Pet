const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/AppointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentIdParamsSchema,
} = require('../schemas/appointmentSchemas');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Cria um agendamento (apenas tutores)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service_id
 *               - pet_id
 *               - start_time
 *               - end_time
 *             properties:
 *               service_id:
 *                 type: string
 *                 format: uuid
 *               pet_id:
 *                 type: string
 *                 format: uuid
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *       400:
 *         description: Dados inválidos ou serviço desativado
 *       403:
 *         description: Acesso restrito a tutores ou pet não pertence ao tutor
 *       404:
 *         description: Serviço ou pet não encontrado
 */
router.post(
  '/',
  validate({ body: createAppointmentSchema }),
  AppointmentController.create
);

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: Lista agendamentos do usuário autenticado (tutor ou parceiro)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *       401:
 *         description: Não autenticado
 */
router.get('/', AppointmentController.list);

/**
 * @swagger
 * /api/v1/appointments/my:
 *   get:
 *     summary: Lista agendamentos do tutor logado (endpoint explícito)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agendamentos do tutor
 */
router.get('/my', AppointmentController.listMine);

/**
 * @swagger
 * /api/v1/appointments/provider:
 *   get:
 *     summary: Lista agenda do parceiro logado (endpoint explícito)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agendamentos do parceiro
 *       403:
 *         description: Acesso restrito a parceiros cadastrados
 */
router.get('/provider', AppointmentController.listProvider);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Detalhe de um agendamento (tutor ou parceiro dono)
 *     tags: [Appointments]
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
 *         description: Detalhes do agendamento
 *       403:
 *         description: Sem permissão para visualizar
 *       404:
 *         description: Agendamento não encontrado
 */
router.get(
  '/:id',
  validate({ params: appointmentIdParamsSchema }),
  AppointmentController.getById
);

/**
 * @swagger
 * /api/v1/appointments/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um agendamento
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: Novo status do agendamento
 *                 example: CONFIRMADO
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       403:
 *         description: Sem permissão para alterar este agendamento
 *       404:
 *         description: Agendamento não encontrado
 *       422:
 *         description: Status inválido ou transição não permitida
 */
router.patch(
  '/:id/status',
  validate({
    params: appointmentIdParamsSchema,
    body: updateAppointmentStatusSchema,
  }),
  AppointmentController.updateStatus
);

module.exports = router;
