const prisma = require('../../config/database');

class GetProviderDetailsUseCase {
  async execute(providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            avatar_url: true,
            role_id: true,
            phone: true
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
            rating: true, // If we add rating to DB later
            badge: true // If we add badge to DB later
          }
        },
        services: {
          where: { is_active: true },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!provider) {
      throw new Error('Provedor não encontrado');
    }

    // Mapping products price since Prisma Decimal comes out as an object/string
    if (provider.products) {
       provider.products = provider.products.map(p => ({
         ...p,
         price: Number(p.price)
       }));
    }
    if (provider.services) {
       provider.services = provider.services.map(s => ({
         ...s,
         price: Number(s.price)
       }));
    }

    return provider;
  }
}

module.exports = new GetProviderDetailsUseCase();
