const { metricsWindow, paidOrdersWhere, revenueSeries, appointmentPayments, cents, amount } = require('../utils/commerceMetrics');
const { toCountMap } = require('../utils/adminMetrics');

class CommerceMetricsRepository {
  constructor(db) { this.db = db; }
  async summary({ providerId, days, now = new Date() }) {
    const window = metricsWindow(days, now);
    const scope = providerId ? { provider_id: providerId } : {};
    const dateRange = { gte: window.since, lte: window.until };
    const base = { ...scope, created_at: dateRange };
    const paid = paidOrdersWhere(base);
    const [orders, appointments, revenue, gatewayRevenue, daily, mix, payments, recentOrders, recentAppointments] = await Promise.all([
      this.db.order.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
      this.db.appointment.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
      this.db.order.aggregate({ where: paid, _sum: { total_price: true }, _count: { _all: true } }),
      this.db.order.aggregate({ where: { ...paid, payment_attempt: { is: { status: 'APPROVED' } } }, _sum: { total_price: true } }),
      this.db.order.groupBy({ by: ['created_at'], where: paid, _sum: { total_price: true } }),
      this.db.appointment.groupBy({ by: ['service_id'], where: base, _count: { _all: true } }),
      this.db.appointmentPayment.findMany({ where: { appointment: { is: scope }, OR: [{ paid_at: dateRange }, { refunded_at: dateRange }] }, select: { status: true, amount: true, paid_at: true, refunded_at: true } }),
      providerId ? this.db.order.findMany({ where: base, select: { id: true, status: true, total_price: true, created_at: true }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: 10 }) : [],
      providerId ? this.db.appointment.findMany({ where: base, select: { id: true, status: true, total_price: true, created_at: true, start_time: true, service: { select: { name: true } } }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: 10 }) : [],
    ]);
    const services = mix.length ? await this.db.service.findMany({ where: { id: { in: mix.map(row => row.service_id) }, ...scope }, select: { id: true, name: true } }) : [];
    const count = rows => rows.reduce((sum, row) => sum + row._count._all, 0);
    const totalCents = cents(revenue._sum.total_price);
    return {
      range: { days, since: window.since, until: window.until, time_zone: window.time_zone, date_basis: 'CREATED_AT' },
      orders: { total: count(orders), by_status: toCountMap(orders, 'status') },
      appointments: { total: count(appointments), by_status: toCountMap(appointments, 'status') },
      revenue: { orders_amount: amount(totalCents), paid_orders: revenue._count._all,
        average_order: revenue._count._all ? amount(Math.round(totalCents / revenue._count._all)) : 0,
        gateway_orders_amount: Number(gatewayRevenue._sum.total_price || 0),
        basis: 'PAID_ORDER_STATUS', environment: 'SIMULATED_OR_SANDBOX', daily: revenueSeries(daily, window.keys) },
      appointment_payments: appointmentPayments(payments, window),
      service_mix: mix.map(row => ({ id: row.service_id, name: services.find(s => s.id === row.service_id)?.name || 'Serviço indisponível', count: row._count._all })),
      recent_orders: recentOrders.map(row => ({ ...row, total_price: Number(row.total_price) })),
      recent_appointments: recentAppointments.map(row => ({ ...row, total_price: Number(row.total_price) })),
    };
  }
}
module.exports = { CommerceMetricsRepository };
