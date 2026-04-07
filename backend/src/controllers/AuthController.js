const LoginUseCase = require('../useCases/auth/LoginUseCase');
const RegisterUseCase = require('../useCases/auth/RegisterUseCase');

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
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  async register(req, res) {
    try {
      const { full_name, email, password, role_id, business_name, document, terms_accepted } = req.body;

      const result = await RegisterUseCase.execute({ full_name, email, password, role_id, business_name, document, terms_accepted });

      return res.status(201).json({
        success: true,
        user: result
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();