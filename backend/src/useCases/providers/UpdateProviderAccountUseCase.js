const prisma = require('../../config/database');

class UpdateProviderAccountUseCase {
  async execute(userId, data) {
    const {
      business_name,
      phone,
      zip_code,
      address_line,
      city,
      state
    } = data;

    const providerData = {};

    if (business_name !== undefined) providerData.business_name = business_name;
    if (phone !== undefined)         providerData.phone = phone;
    if (zip_code !== undefined)      providerData.zip_code = zip_code;
    if (address_line !== undefined)  providerData.address_line = address_line;
    if (city !== undefined)          providerData.city = city;
    if (state !== undefined)         providerData.state = state;

    const updatedProvider = await prisma.provider.update({
      where: { user_id: userId },
      data: providerData,
      include: { user: true }
    });

    return updatedProvider;
  }
}

module.exports = new UpdateProviderAccountUseCase();
