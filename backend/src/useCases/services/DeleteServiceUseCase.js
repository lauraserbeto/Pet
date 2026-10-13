const serviceRepository = require('../../repositories/ServiceRepository');
const AppError = require('../../utils/AppError');
const { findApprovedServiceProvider, serializeService } = require('./serviceAccess');

class DeleteServiceUseCase {
  async execute({ serviceId, userId, userRole }) {
    const provider = await findApprovedServiceProvider({ userId, userRole });
    const service = await serviceRepository.findById(serviceId);

    if (!service || !service.is_active) {
      throw AppError.notFound('Serviço não encontrado.');
    }

    if (service.provider_id !== provider.id) {
      throw AppError.forbidden('Você não tem permissão para excluir este serviço.');
    }

    const deactivatedService = await serviceRepository.deactivate(service.id);
    return serializeService(deactivatedService, userRole);
  }
}

module.exports = new DeleteServiceUseCase();
