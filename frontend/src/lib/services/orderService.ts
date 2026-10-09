import { httpClient } from '../httpClient';

export type BackendOrderStatus =
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGO'
  | 'PREPARANDO'
  | 'ENVIADO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | string;

export interface OrderItemProduct {
  id: string;
  name: string;
  image_url?: string | null;
  sku?: string | null;
  price?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | string;
  line_total: number;
  product?: OrderItemProduct | null;
}

export interface OrderCustomer {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
}

export interface OrderProvider {
  id: string;
  business_name: string;
}

export interface Order {
  id: string;
  provider_id: string;
  customer_id: string;
  total_price: number | string;
  status: BackendOrderStatus;
  created_at: string;
  updated_at: string;
  provider?: OrderProvider | null;
  customer?: OrderCustomer | null;
  items: OrderItem[];
}

export interface OrderStatusBadgeInfo {
  label: string;
  className: string;
  variant: 'pending' | 'paid' | 'preparing' | 'shipped' | 'completed' | 'cancelled';
}

/** Formata valores numéricos ou strings decimais em Moeda BRL (pt-BR) sem recalcular */
export function formatBRL(value: number | string | undefined | null): string {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

/** Formata string ISO de data para DD/MM/AAAA */
export function formatOrderDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/** Formata data e hora para exibição em tabelas */
export function formatOrderDateTime(dateString: string): { date: string; time: string } {
  if (!dateString) return { date: '-', time: '-' };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { date: '-', time: '-' };
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timeFormatted = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return { date: dateFormatted, time: timeFormatted };
}

/** Mapeia os status canônicos e legados para rótulo amigável em pt-BR */
export function getOrderStatusLabel(status: string): string {
  switch (status?.toUpperCase()) {
    case 'AGUARDANDO_PAGAMENTO':
    case 'AWAITING_PAYMENT':
    case 'PENDING':
    case 'PENDENTE':
      return 'Aguardando Pagamento';
    case 'PAGO':
    case 'PAID':
      return 'Pago';
    case 'PREPARANDO':
    case 'PREPARING':
    case 'EM SEPARAÇÃO':
    case 'EM SEPARACAO':
      return 'Em Preparação';
    case 'ENVIADO':
    case 'SHIPPED':
      return 'Enviado';
    case 'CONCLUIDO':
    case 'COMPLETED':
    case 'DELIVERED':
    case 'ENTREGUE':
      return 'Concluído';
    case 'CANCELADO':
    case 'CANCELLED':
    case 'CANCELED':
      return 'Cancelado';
    default:
      return status || 'Pendente';
  }
}

/** Retorna rótulo, classe visual e variante semântica para badges de status */
export function getOrderStatusBadge(status: string): OrderStatusBadgeInfo {
  const norm = status?.toUpperCase() || '';
  if (
    norm === 'AGUARDANDO_PAGAMENTO' ||
    norm === 'AWAITING_PAYMENT' ||
    norm === 'PENDING' ||
    norm === 'PENDENTE'
  ) {
    return {
      label: 'Aguardando Pagamento',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      variant: 'pending',
    };
  }
  if (norm === 'PAGO' || norm === 'PAID') {
    return {
      label: 'Pago',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      variant: 'paid',
    };
  }
  if (
    norm === 'PREPARANDO' ||
    norm === 'PREPARING' ||
    norm === 'EM SEPARAÇÃO' ||
    norm === 'EM SEPARACAO'
  ) {
    return {
      label: 'Em Preparação',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      variant: 'preparing',
    };
  }
  if (norm === 'ENVIADO' || norm === 'SHIPPED') {
    return {
      label: 'Enviado',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      variant: 'shipped',
    };
  }
  if (
    norm === 'CONCLUIDO' ||
    norm === 'COMPLETED' ||
    norm === 'DELIVERED' ||
    norm === 'ENTREGUE'
  ) {
    return {
      label: 'Concluído',
      className: 'bg-green-50 text-green-700 border-green-200',
      variant: 'completed',
    };
  }
  if (norm === 'CANCELADO' || norm === 'CANCELLED' || norm === 'CANCELED') {
    return {
      label: 'Cancelado',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      variant: 'cancelled',
    };
  }
  return {
    label: status || 'Pendente',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
    variant: 'pending',
  };
}

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
  },

  // 3. Lista os pedidos do tutor autenticado (GET /orders)
  listMyOrders: async (params?: { page?: number; limit?: number }): Promise<Order[]> => {
    const response = await httpClient.get<Order[] | { orders: Order[] }>('/orders', {
      query: params,
    });
    if (Array.isArray(response)) return response;
    if (response && Array.isArray((response as any).orders)) return (response as any).orders;
    return [];
  },

  // 4. Lista os pedidos recebidos pelo parceiro autenticado (GET /providers/orders)
  listProviderOrders: async (params?: { page?: number; limit?: number }): Promise<Order[]> => {
    const response = await httpClient.get<Order[] | { orders: Order[] }>('/providers/orders', {
      query: params,
    });
    if (Array.isArray(response)) return response;
    if (response && Array.isArray((response as any).orders)) return (response as any).orders;
    return [];
  },
};