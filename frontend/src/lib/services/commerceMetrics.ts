export interface CommerceMetrics {
  range: {
    days: number;
    since: string;
    until: string;
    time_zone: string;
    date_basis: "CREATED_AT";
  };
  orders: { total: number; by_status: Record<string, number> };
  appointments: { total: number; by_status: Record<string, number> };
  revenue: {
    orders_amount: number;
    paid_orders: number;
    average_order: number;
    gateway_orders_amount: number;
    basis: "PAID_ORDER_STATUS";
    environment: "SIMULATED_OR_SANDBOX";
    daily: { date: string; amount: number }[];
  };
  appointment_payments: {
    gross_amount: number;
    refunded_amount: number;
    net_amount: number;
    paid_count: number;
    refunded_count: number;
    mode: "SIMULATED";
  };
  service_mix: { id: string; name: string; count: number }[];
  recent_orders: { id: string; status: string; total_price: number; created_at: string }[];
  recent_appointments: {
    id: string;
    status: string;
    total_price: number;
    created_at: string;
    start_time: string;
    service: { name: string };
  }[];
}
export interface ProviderMetrics {
  generated_at: string;
  provider: { id: string; business_name: string };
  commerce: CommerceMetrics;
}
