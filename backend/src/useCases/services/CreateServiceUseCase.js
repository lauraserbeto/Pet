const serviceRepository = require('../../repositories/ServiceRepository');
const prisma = require('../../config/database');

class CreateServiceUseCase {
  async execute({ provider_user_id, name, category, description, price, duration_minutes }) {
    
    if (!name || name.trim() === "") {
      throw new Error("O nome do serviço é obrigatório.");
    }

    if (price === undefined || price < 0) {
      throw new Error("O preço do serviço não pode ser negativo.");
    }

    // Localizar o Provedor vinculado a este Usuário (req.userId)
    const provider = await prisma.provider.findUnique({
      where: { user_id: provider_user_id }
    });

    if (!provider) {
      throw new Error("Perfil de Provedor não encontrado para este usuário.");
    }

    const service = await serviceRepository.create({
      provider_id: provider.id,
      name,
      category,
      description,
      price,
      duration_minutes,
      is_active: true
    });

    return service;
  }
}

module.exports = new CreateServiceUseCase();