const serviceRepository = require('../../repositories/ServiceRepository');
const { findApprovedServiceProvider, serializeService } = require('./serviceAccess');

class ListProviderServicesUseCase {
  async execute({ userId, userRole }) {
    const provider = await findApprovedServiceProvider({ userId, userRole });
    const services = await serviceRepository.findByProviderId(provider.id);

    return services.map((service) => serializeService(service, userRole));
  }
}

module.exports = new ListProviderServicesUseCase();
