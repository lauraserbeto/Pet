const serviceRepository = require('../../repositories/ServiceRepository');
const AppError = require('../../utils/AppError');
const {
  assertValidCategory,
  findApprovedServiceProvider,
  serializeService,
} = require('./serviceAccess');

class UpdateServiceUseCase {
  async execute({ serviceId, userId, userRole, data }) {
    const provider = await findApprovedServiceProvider({ userId, userRole });
    const service = await serviceRepository.findById(serviceId);

    if (!service || !service.is_active) {
      throw AppError.notFound('Serviço não encontrado.');
    }

    if (service.provider_id !== provider.id) {
      throw AppError.forbidden('Você não tem permissão para editar este serviço.');
    }

    const category = data.category ?? service.category;
    assertValidCategory(category);

    const updatedService = await serviceRepository.update(service.id, data);
    return serializeService(updatedService, userRole);
  }
}

module.exports = new UpdateServiceUseCase();
