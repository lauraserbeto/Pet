const { Resend } = require("resend");
const { RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO } = require("../config/env");

const PASSWORD_RESET_TEMPLATE_ID = "password-reset";
const PROVIDER_REJECTION_TEMPLATE_ID = "cadastro-rejeitado";

function assertEmailConfig() {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error(
      "[EMAIL] RESEND_API_KEY e EMAIL_FROM precisam estar configurados.",
    );
  }
}

function unwrapResendResponse(response) {
  if (response.error) {
    const error = new Error(
      response.error.message || "Falha ao enviar e-mail.",
    );
    error.provider = "resend";
    error.details = response.error;
    throw error;
  }

  return response.data;
}

function escapeTemplateText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class EmailService {
  constructor() {
    this.client = null;
  }

  getClient() {
    assertEmailConfig();
    if (!this.client) {
      this.client = new Resend(RESEND_API_KEY);
    }
    return this.client;
  }

  async send({ to, subject, html, text }) {
    if (!to || !subject || !html) {
      throw new Error("[EMAIL] to, subject e html são obrigatórios.");
    }

    const response = await this.getClient().emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      ...(EMAIL_REPLY_TO ? { replyTo: EMAIL_REPLY_TO } : {}),
      ...(text ? { text } : {}),
    });

    return unwrapResendResponse(response);
  }

  async sendTemplate({ to, templateId, variables }) {
    if (!to || !templateId) {
      throw new Error("[EMAIL] to e templateId são obrigatórios.");
    }

    const response = await this.getClient().emails.send({
      from: EMAIL_FROM,
      to,
      ...(EMAIL_REPLY_TO ? { replyTo: EMAIL_REPLY_TO } : {}),
      template: {
        id: templateId,
        variables: variables || {},
      },
    });

    return unwrapResendResponse(response);
  }

  sendPasswordReset(to, resetUrl) {
    return this.sendTemplate({
      to,
      templateId: PASSWORD_RESET_TEMPLATE_ID,
      variables: {
        RESET_URL: resetUrl,
      },
    });
  }

  sendRejection(to, { reason, correctionUrl }) {
    return this.sendTemplate({
      to,
      templateId: PROVIDER_REJECTION_TEMPLATE_ID,
      variables: {
        REASON: escapeTemplateText(reason),
        CORRECTION_URL: correctionUrl,
      },
    });
  }
}

module.exports = new EmailService();
module.exports.EmailService = EmailService;
module.exports.PASSWORD_RESET_TEMPLATE_ID = PASSWORD_RESET_TEMPLATE_ID;
module.exports.PROVIDER_REJECTION_TEMPLATE_ID = PROVIDER_REJECTION_TEMPLATE_ID;
module.exports.escapeTemplateText = escapeTemplateText;
