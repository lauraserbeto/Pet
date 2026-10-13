const serviceRepository = require('../../repositories/ServiceRepository');
const {
  assertValidCategory,
  findApprovedServiceProvider,
  serializeService,
} = require('./serviceAccess');

class CreateServiceUseCase {
  async execute({ userId, userRole, name, category, description, price, duration_minutes }) {
    const provider = await findApprovedServiceProvider({ userId, userRole });
    assertValidCategory(category);

    const service = await serviceRepository.create({
      provider_id: provider.id,
      name,
      category,
      description,
      price,
      duration_minutes,
      is_active: true
    });

    return serializeService(service, userRole);
  }
}

module.exports = new CreateServiceUseCase();
