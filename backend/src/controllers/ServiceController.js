const createServiceUseCase = require('../useCases/services/CreateServiceUseCase');
const listProviderServicesUseCase = require('../useCases/services/ListProviderServicesUseCase');
const updateServiceUseCase = require('../useCases/services/UpdateServiceUseCase');
const deleteServiceUseCase = require('../useCases/services/DeleteServiceUseCase');

class ServiceController {
  async create(req, res, next) {
    try {
      const service = await createServiceUseCase.execute({
        userId: req.userId,
        userRole: req.userRole,
        ...req.body,
      });

      return res.status(201).json({ service });
    } catch (error) {
      return next(error);
    }
  }

  async listMine(req, res, next) {
    try {
      const services = await listProviderServicesUseCase.execute({
        userId: req.userId,
        userRole: req.userRole,
      });

      return res.status(200).json(services);
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const service = await updateServiceUseCase.execute({
        serviceId: req.params.id,
        userId: req.userId,
        userRole: req.userRole,
        data: req.body,
      });

      return res.status(200).json({ service });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const service = await deleteServiceUseCase.execute({
        serviceId: req.params.id,
        userId: req.userId,
        userRole: req.userRole,
      });

      return res.status(200).json({ service });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ServiceController();
