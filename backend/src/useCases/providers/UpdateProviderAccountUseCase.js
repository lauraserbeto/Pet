const prisma = require('../../config/database');
const { isValidPaymentPolicy } = require('../../constants/paymentPolicy');
const AppError = require('../../utils/AppError');

class UpdateProviderAccountUseCase {
  constructor({ providerRepository = prisma.provider } = {}) {
    this.providerRepository = providerRepository;
  }

  async execute(userId, data) {
    const {
      business_name,
      phone,
      zip_code,
      address_line,
      city,
      state,
      payment_policy
    } = data;

    const providerData = {};

    if (business_name !== undefined) providerData.business_name = business_name;
    if (phone !== undefined)         providerData.phone = phone;
    if (zip_code !== undefined)      providerData.zip_code = zip_code;
    if (address_line !== undefined)  providerData.address_line = address_line;
    if (city !== undefined)          providerData.city = city;
    if (state !== undefined)         providerData.state = state;

    // AGD-1 criou a coluna `payment_policy`, mas nenhum endpoint a gravava —
    // a SRV-F1 precisa do seletor e a AGD-2 vai ler o valor.
    if (payment_policy !== undefined) {
      if (!isValidPaymentPolicy(payment_policy)) {
        throw AppError.validation('Política de cobrança inválida. Use PRESENCIAL ou PRE_PAGO.');
      }
      providerData.payment_policy = payment_policy;
    }

    const updatedProvider = await this.providerRepository.update({
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
      }
    });

    return updatedProvider;
  }
}

module.exports = new UpdateProviderAccountUseCase();
module.exports.UpdateProviderAccountUseCase = UpdateProviderAccountUseCase;
