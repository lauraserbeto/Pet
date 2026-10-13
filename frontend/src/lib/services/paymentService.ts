import { httpClient } from '../httpClient';
import type { Order } from './orderService';

export interface PaymentConfig {
  provider: 'SIMULATED' | 'MERCADO_PAGO';
  sandbox: boolean;
}

export interface PaymentState {
  order: Order;
  paymentStatus: string | null;
}

export const paymentService = {
  configuration: () => httpClient.get<PaymentConfig>('/orders/payment-config'),
  preference: (orderId: string) => httpClient.post<{ preferenceId: string; initPoint: string }>(
    `/orders/${encodeURIComponent(orderId)}/payment-preference`,
  ),
  status: (orderId: string) => httpClient.get<PaymentState>(
    `/orders/${encodeURIComponent(orderId)}/payment-status`,
  ),
};

export function paymentConfirmed(status: string) {
  return ['PAGO', 'PREPARANDO', 'ENVIADO', 'CONCLUIDO'].includes(status);
}

export function paymentUrl(orderIds: string[]) {
  return `/checkout/payment?${new URLSearchParams({ orders: orderIds.join(',') })}`;
}
