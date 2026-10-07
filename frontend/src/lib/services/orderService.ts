import { httpClient } from '../httpClient';

export const orderService = {
  // 1. Cria o pedido real baseado no carrinho e endereço
  createOrder: async (payload: any) => {
    const response = await httpClient.post('/orders', payload);
    return response;
  },

  // 2. Simula o pagamento do pedido recém-criado
  payOrder: async (orderId: string) => {
    const response = await httpClient.post(`/orders/${orderId}/pay`);
    return response;
  }
};