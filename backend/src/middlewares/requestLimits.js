const { rateLimit } = require("express-rate-limit");
const LIMIT_POLICY = Object.freeze({
  api: { limit: 300, windowMs: 300000 },
  auth: { limit: 20, windowMs: 900000 },
  webhook: { limit: 600, windowMs: 60000 },
  health: { limit: 60, windowMs: 60000 },
  metrics: { limit: 60, windowMs: 60000 },
});
function createRequestLimits(overrides = {}) {
  const limiters = {};
  for (const [name, policy] of Object.entries(LIMIT_POLICY))
    limiters[name] = rateLimit({
      ...policy,
      ...overrides[name],
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Muitas requisições. Aguarde um pouco e tente novamente.",
        },
        message: "Muitas requisições. Aguarde um pouco e tente novamente.",
      },
    });
  const api = (req, res, next) => {
    const path = req.originalUrl
      .split("?")[0]
      .replace(/\/+$/, "")
      .toLowerCase();
    if (
      ["GET", "HEAD"].includes(req.method) &&
      ["/api/health", "/api/metrics"].includes(path)
    )
      return next();
    if (req.method === "POST" && path === "/api/v1/orders/webhook")
      return next();
    return limiters.api(req, res, next);
  };
  return { ...limiters, api };
}
module.exports = { createRequestLimits, LIMIT_POLICY };
