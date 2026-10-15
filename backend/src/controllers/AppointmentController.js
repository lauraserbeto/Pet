const createAppointmentUseCase = require('../useCases/appointments/CreateAppointmentUseCase');
const listAppointmentsUseCase = require('../useCases/appointments/ListAppointmentsUseCase');
const updateAppointmentStatusUseCase = require('../useCases/appointments/UpdateAppointmentStatusUseCase');


// Roles
const PARTNER_ROLES = [3, 4]; // HOTEL, PET_SITTER

class AppointmentController {
  /** POST /api/v1/appointments — Tutor cria agendamento */
  async create(req, res, next) {
    try {
      const result = await createAppointmentUseCase.execute({
        userId: req.userId,
        userRole: req.userRole,
        ...req.body,
      });

      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /api/v1/appointments — Lista agendamentos do usuário autenticado */
  async list(req, res, next) {
    try {
      let result;

      if (PARTNER_ROLES.includes(req.userRole)) {
        result = await listAppointmentsUseCase.listForProvider(req.userId);
      } else {
        result = await listAppointmentsUseCase.listForTutor(req.userId);
      }

      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /api/v1/appointments/my — Lista agendamentos do tutor logado (explícito) */
  async listMine(req, res, next) {
    try {
      const result = await listAppointmentsUseCase.listForTutor(req.userId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /api/v1/appointments/provider — Lista agenda do parceiro logado (explícito) */
  async listProvider(req, res, next) {
    try {
      const result = await listAppointmentsUseCase.listForProvider(req.userId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /api/v1/appointments/:id — Detalhe de um agendamento */
  async getById(req, res, next) {
    try {
      const result = await listAppointmentsUseCase.findById(
        req.params.id,
        req.userId,
        req.userRole
      );
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  /** PATCH /api/v1/appointments/:id/status — Atualiza status */
  async updateStatus(req, res, next) {
    try {
      const result = await updateAppointmentStatusUseCase.execute({
        appointmentId: req.params.id,
        status: req.body.status,
        userId: req.userId,
        userRole: req.userRole,
      });

      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AppointmentController();
