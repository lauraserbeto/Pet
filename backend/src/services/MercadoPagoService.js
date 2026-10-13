const { MercadoPagoConfig, Preference, Payment, User, WebhookSignatureValidator } = require('mercadopago');
const { MERCADO_PAGO } = require('../config/env');
const AppError = require('../utils/AppError');

class MercadoPagoService {
  constructor(config = MERCADO_PAGO) {
    this.config = config;
    this.client = null;
    this.testAccountVerified = false;
  }

  assertEnabled() {
    if (!this.config.enabled) {
      throw new AppError('Mercado Pago indisponível neste ambiente.', 503, 'PAYMENT_GATEWAY_DISABLED');
    }
  }

  getClient() {
    this.assertEnabled();
    this.client ||= new MercadoPagoConfig({
      accessToken: this.config.accessToken,
      options: { timeout: 8000 },
    });
    return this.client;
  }

  getAccount() {
    return new User(this.getClient()).get();
  }

  async assertTestAccount() {
    this.assertEnabled();
    if (this.testAccountVerified) return;
    const account = await this.getAccount();
    if (String(account.id) !== this.config.testUserId || !account.tags?.includes('test_user')) {
      throw new AppError('Configure uma conta de vendedor de teste do Mercado Pago.', 503, 'TEST_ACCOUNT_REQUIRED');
    }
    this.testAccountVerified = true;
  }

  createPreference(body, idempotencyKey) {
    return new Preference(this.getClient()).create({ body, requestOptions: { idempotencyKey } });
  }

  getPayment(id) {
    return new Payment(this.getClient()).get({ id });
  }

  verifySignature({ signature, requestId, paymentId }) {
    this.assertEnabled();
    if (!signature || !requestId || !paymentId) {
      throw AppError.unauthorized('Assinatura de webhook ausente.');
    }
    try {
      WebhookSignatureValidator.validate({
        xSignature: signature,
        xRequestId: requestId,
        dataId: paymentId,
        secret: this.config.webhookSecret,
      });
    } catch {
      throw AppError.unauthorized('Assinatura de webhook inválida.');
    }
  }
}

module.exports = new MercadoPagoService();
module.exports.MercadoPagoService = MercadoPagoService;
