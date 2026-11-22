const LoginUseCase = require("../useCases/auth/LoginUseCase");
const RegisterUseCase = require("../useCases/auth/RegisterUseCase");
const {
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
} = require("../useCases/auth/PasswordResetUseCase");
const AppError = require("../utils/AppError");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password
      ) {
        throw AppError.badRequest("E-mail e senha são obrigatórios.");
      }

      const result = await LoginUseCase.execute(email, password);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error.statusCode === 403 && !(error instanceof AppError))
        return next(AppError.forbidden(error.message));
      return next(error);
    }
  }

  async register(req, res, next) {
    try {
      const {
        full_name,
        email,
        password,
        role_id,
        business_name,
        document,
        document_type,
        terms_accepted,
        terms_version,
      } = req.body;

      const result = await RegisterUseCase.execute({
        full_name,
        email,
        password,
        role_id,
        business_name,
        document,
        document_type,
        terms_accepted,
        terms_version,
      });

      return res.status(201).json({
        success: true,
        user: result,
      });
    } catch (error) {
      return next(error);
    }
  }
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        throw AppError.badRequest("E-mail é obrigatório.");
      }
      const result = await ForgotPasswordUseCase.execute(email);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        throw AppError.badRequest("Token e nova senha são obrigatórios.");
      }
      const result = await ResetPasswordUseCase.execute(token, password);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
