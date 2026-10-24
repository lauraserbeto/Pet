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
 *     description: |
 *       Nasce PENDENTE, com a payment_policy do parceiro gravada no agendamento.
 *       Total = preço do serviço × diárias (hotel) ou horas (pet sitter).
 *       Início no futuro; hotel até 30 diárias, pet sitter até 12 horas.
 *       O mesmo pet, ou o mesmo pet sitter, não pode ter dois agendamentos
 *       ativos (PENDENTE, AGUARDANDO_CONFIRMACAO ou CONFIRMADO) no mesmo período.
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
 *                 description: ISO 8601 com fuso (Z ou ±hh:mm)
 *                 example: 2026-11-10T14:00:00-03:00
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 com fuso (Z ou ±hh:mm)
 *                 example: 2026-11-12T11:00:00-03:00
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Agendamento criado (status PENDENTE), com payment_policy e pricing (unit, quantity, unit_price)
 *       400:
 *         description: Serviço desativado ou que não é de hotel/pet sitter
 *       403:
 *         description: Acesso restrito a tutores, pet de outro tutor ou parceiro que não está operando (PROVIDER_NOT_OPERATIONAL)
 *       404:
 *         description: Serviço ou pet não encontrado
 *       409:
 *         description: Conflito de horário com o mesmo pet ou o mesmo pet sitter (SCHEDULE_CONFLICT)
 *       422:
 *         description: Dados inválidos, início no passado, fim antes do início ou período acima do limite
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
 *     description: |
 *       Regras pela política gravada no agendamento (DEC-A):
 *       - Parceiro: CONFIRMADO ou RECUSADO a partir de PENDENTE (só PRESENCIAL) ou de
 *         AGUARDANDO_CONFIRMACAO (PRE_PAGO pago); CONCLUIDO a partir de CONFIRMADO, depois
 *         do início; CANCELADO a partir de CONFIRMADO, antes do início.
 *       - Tutor: CANCELADO a partir de PENDENTE, AGUARDANDO_CONFIRMACAO ou CONFIRMADO,
 *         antes do início.
 *       AGUARDANDO_CONFIRMACAO só é alcançado pelo pagamento (PAG-2).
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
 *                 enum: [CONFIRMADO, RECUSADO, CONCLUIDO, CANCELADO]
 *                 description: Novo status do agendamento
 *                 example: CONFIRMADO
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       403:
 *         description: Sem permissão para alterar este agendamento ou para esta transição
 *       404:
 *         description: Agendamento não encontrado
 *       409:
 *         description: O status foi alterado por outra ação entre a leitura e a gravação
 *       422:
 *         description: Status inválido, transição não permitida, pagamento pendente ou fora do horário permitido
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
