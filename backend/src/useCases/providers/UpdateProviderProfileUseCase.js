const prisma = require("../../config/database");
const {
  updateProviderProfileSchema,
} = require("../../schemas/providerSchemas");

class UpdateProviderProfileUseCase {
  async execute(userId, data) {
    data = updateProviderProfileSchema.parse(data);
    // 1. Extrair campos do payload (Vitrine)
    const {
      description,
      avatar_url,
      phone,
      zip_code,
      address_line,
      city,
      state,
      allowed_animals,
      amenities,
      gallery_images,
      highlights,
      sitter_roles,
      daily_rate,
      hourly_rate,
      operating_hours,
      rules_policies,
    } = data;

    return prisma.$transaction(async (tx) => {
      // 2. Atualizar a tabela User se o avatar_url estiver presente
      if (avatar_url !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { avatar_url },
        });
      }

      // 3. Montar o objeto de dados do Provider
      const providerData = {};

      if (description !== undefined) providerData.description = description;
      if (phone !== undefined) providerData.phone = phone;
      if (zip_code !== undefined) providerData.zip_code = zip_code;
      if (address_line !== undefined) providerData.address_line = address_line;
      if (city !== undefined) providerData.city = city;
      if (state !== undefined) providerData.state = state;
      if (operating_hours !== undefined)
        providerData.operating_hours = operating_hours;
      if (allowed_animals !== undefined)
        providerData.allowed_animals = allowed_animals;
      if (amenities !== undefined) providerData.amenities = amenities;
      if (gallery_images !== undefined)
        providerData.gallery_images = gallery_images;
      if (highlights !== undefined) providerData.highlights = highlights;
      if (sitter_roles !== undefined) providerData.sitter_roles = sitter_roles;

      // Conversão segura para Decimal/Float
      if (daily_rate !== undefined)
        providerData.daily_rate = parseFloat(daily_rate) || 0;
      if (hourly_rate !== undefined)
        providerData.hourly_rate = parseFloat(hourly_rate) || 0;

      // Garantir que rules_policies seja string
      if (rules_policies !== undefined) {
        providerData.rules_policies =
          typeof rules_policies === "string"
            ? rules_policies
            : JSON.stringify(rules_policies);
      }

      // 4. Atualizar o Provider
      const updatedProvider = await tx.provider.update({
        where: { user_id: userId },
        data: providerData,
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
              role_id: true,
              phone: true,
            },
          },
        },
      });

      return updatedProvider;
    });
  }
}

module.exports = new UpdateProviderProfileUseCase();
