const AppError = require("../utils/AppError");
module.exports = function providerMiddleware(req, _res, next) {
  if (![2, 3, 4].includes(req.userRole))
    return next(AppError.forbidden("Acesso restrito a parceiros."));
  return next();
};
