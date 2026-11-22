const AppError = require("./AppError");

// Ordem comum para pagamento, preferência, webhook e cancelamento:
// primeiro Order, depois PaymentAttempt. Nunca manter transação aberta no gateway.
async function lockOrder(tx, orderId) {
  await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
}
function orderConcurrencyError(error) {
  if (error.code === "P2034")
    return AppError.conflict(
      "O carrinho, estoque ou pedido mudou durante a operação. Atualize os dados antes de tentar novamente.",
    );
  return error;
}
module.exports = { lockOrder, orderConcurrencyError };
