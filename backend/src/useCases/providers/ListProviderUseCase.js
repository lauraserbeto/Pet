const ProviderRepository = require('../../repositories/ProviderRepository');

class ListProvidersUseCase {
  async execute(status) {
    const providers = await ProviderRepository.findAll(status);
    return providers;
  }
}

module.exports = new ListProvidersUseCase();