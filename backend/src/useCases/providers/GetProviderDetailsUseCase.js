const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { operationalProviderWhere } = require('./providerAccess');

class GetProviderDetailsUseCase {
  // Detalhe público: só parceiro operacional (aprovado, conta ativa e, se Pet
  // Sitter, avaliação aprovada — E-01). Os demais respondem 404, como inexistentes.
  async execute(providerId) {
    const provider = await prisma.provider.findFirst({
      where: { id: providerId, ...operationalProviderWhere() },
      include: {
        user: {
          select: {
            full_name: true,
            avatar_url: true,
            role_id: true,
          }
        },
        products: {
          where: { status: 'ACTIVE' },
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            name: true,
            category: true,
            pet_type: true,
            price: true,
            image_url: true,
            description: true
          }
        },
        services: {
          where: { is_active: true },
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            provider_id: true,
            name: true,
            category: true,
            description: true,
            price: true,
            duration_minutes: true,
            is_active: true,
            created_at: true,
          },
        }
      }
    });

    if (!provider) {
      throw AppError.notFound('Parceiro não encontrado.');
    }

    // Mapping products price since Prisma Decimal comes out as an object/string
    if (provider.products) {
       provider.products = provider.products.map(p => ({
         ...p,
         price: Number(p.price),
         rating: 4.5, // Mocked for frontend compatibility
         badge: "Novo" // Mocked for frontend compatibility
       }));
    }
    if (provider.services) {
       provider.services = provider.services.map(s => ({
         ...s,
         price: Number(s.price),
         billing_unit: provider.user?.role_id === 3
           ? 'DIARIA'
           : provider.user?.role_id === 4
             ? 'HORA'
             : null,
       }));
    }

    return provider;
  }
}

module.exports = new GetProviderDetailsUseCase();
