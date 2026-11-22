const AppError = require("../utils/AppError");
function adminMiddleware(req, res, next) {
  // Verifica se a role_id é 1 (Admin)
  if (req.userRole !== 1) {
    return next(
      AppError.forbidden(
        "Acesso negado. Apenas administradores podem realizar esta ação.",
      ),
    );
  }

  return next();
}

module.exports = adminMiddleware;
