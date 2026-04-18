const LoginUseCase = require('../useCases/auth/LoginUseCase');
const RegisterUseCase = require('../useCases/auth/RegisterUseCase');
const { ForgotPasswordUseCase, ResetPasswordUseCase } = require('../useCases/auth/PasswordResetUseCase');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
      }

      const result = await LoginUseCase.execute(email, password);

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      const status = error.statusCode || 401;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async register(req, res) {
    try {
      const { full_name, email, password, role_id, business_name, document, document_type, terms_accepted } = req.body;

      const result = await RegisterUseCase.execute({ full_name, email, password, role_id, business_name, document, document_type, terms_accepted });

      return res.status(201).json({
        success: true,
        user: result
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });
      }
      const result = await ForgotPasswordUseCase.execute(email.trim().toLowerCase());
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios.' });
      }
      const result = await ResetPasswordUseCase.execute(token, password);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();