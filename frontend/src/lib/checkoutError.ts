import { ApiError } from "./httpClient";
export function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const code = error.code;
    if (error.status >= 500)
      return {
        title: "Não foi possível finalizar",
        description: "O serviço está indisponível no momento. Tente novamente mais tarde.",
        code,
        cartAction: false,
      };
    if (
      error.status === 409 ||
      ["INSUFFICIENT_STOCK", "PROVIDER_UNAVAILABLE", "CART_EMPTY"].includes(code)
    )
      return {
        title: /estoque/i.test(error.message) ? "Estoque insuficiente" : "Revise sua compra",
        description: error.message,
        code,
        cartAction: true,
      };
    if (["PAYMENT_FAILED", "PAYMENT_DECLINED"].includes(code))
      return { title: "Falha no pagamento", description: error.message, code, cartAction: false };
    return {
      title: error.status === 429 ? "Aguarde um pouco" : "Confira os dados da compra",
      description: error.message,
      code,
      cartAction: false,
    };
  }
  return {
    title: "Não foi possível finalizar",
    description: "Confira sua conexão e tente novamente.",
    code: "UNKNOWN",
    cartAction: false,
  };
}
