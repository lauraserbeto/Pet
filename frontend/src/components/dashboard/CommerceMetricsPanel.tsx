import { CalendarDays, ShoppingBag, DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CommerceMetrics } from "../../lib/services/commerceMetrics";
import { StatCard } from "./StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const day = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}`;
const dateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
const labels: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  PREPARANDO: "Preparando",
  ENVIADO: "Enviado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  PENDENTE: "Pendente",
  AGUARDANDO_CONFIRMACAO: "Aguardando confirmação",
  CONFIRMADO: "Confirmado",
  RECUSADO: "Recusado",
};

// Mesma paleta dos selos de pedido e agendamento do Tutor (G13/G14).
const statusTone: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "bg-amber-50 text-amber-800 border-amber-200",
  PENDENTE: "bg-amber-50 text-amber-800 border-amber-200",
  PAGO: "bg-blue-50 text-blue-700 border-blue-200",
  AGUARDANDO_CONFIRMACAO: "bg-blue-50 text-blue-700 border-blue-200",
  PREPARANDO: "bg-purple-50 text-purple-700 border-purple-200",
  ENVIADO: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONFIRMADO: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONCLUIDO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RECUSADO: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELADO: "bg-slate-100 text-slate-700 border-slate-200",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone[status] || statusTone.CANCELADO}`}
    >
      {labels[status] || status}
    </span>
  );
}

export function CommerceMetricsPanel({
  data,
  role,
  financial = true,
}: {
  data: CommerceMetrics;
  role?: number;
  financial?: boolean;
}) {
  const showOrders = !role || role === 2;
  const showAppointments = !role || role === 3 || role === 4;
  const payments = data.appointment_payments;
  return (
    <section aria-label="Indicadores de pedidos e agendamentos" className="space-y-6 min-w-0">
      <p className="text-sm text-slate-600">
        Período: {dateTime(data.range.since)} a {dateTime(data.range.until)} (São Paulo). Pedidos e
        agendamentos são contados pela data de criação.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {showOrders && (
          <>
            <StatCard title="Pedidos no período" value={data.orders.total} icon={ShoppingBag} />
            <StatCard
              title="Vendas reconhecidas"
              value={currency(data.revenue.orders_amount)}
              icon={DollarSign}
              hint={`${data.revenue.paid_orders} pedidos em estado pago ou posterior`}
            />
            <StatCard
              title="Ticket médio dos pedidos pagos"
              value={currency(data.revenue.average_order)}
              icon={ShoppingBag}
            />
          </>
        )}
        {showAppointments && (
          <>
            <StatCard
              title="Agendamentos no período"
              value={data.appointments.total}
              icon={CalendarDays}
            />
            <StatCard
              title="Pré-pagamentos simulados"
              value={currency(payments.gross_amount)}
              icon={DollarSign}
              hint={`${payments.paid_count} pagamentos pela data de aprovação`}
            />
            <StatCard
              title="Estornos simulados"
              value={currency(payments.refunded_amount)}
              icon={DollarSign}
              hint={`${payments.refunded_count} estornos pela data de devolução`}
            />
          </>
        )}
      </div>
      {/* Aviso curto; a regra de contagem fica sob demanda (G14). */}
      <div className="rounded-xl border border-[var(--color-secondary-200)] bg-[var(--color-secondary-50)] p-4 text-sm text-slate-700 space-y-2">
        <p>
          Ambiente de testes: os valores não representam dinheiro recebido em produção ou saldo para
          saque.
        </p>
        <details className="space-y-2">
          <summary className="cursor-pointer font-semibold text-slate-900">
            Como os valores são contados
          </summary>
        {showOrders && (
          <p>
            Vendas reconhecidas incluem pedidos pagos, em preparação, enviados e concluídos, criados
            neste período. Cancelados e tentativas de pagamento não aprovadas ficam fora. A data de
            criação não é a data do recebimento. Pedidos sem registro do gateway mantêm a
            classificação pelo estado, inclusive legados.
          </p>
        )}
        {showAppointments && (
          <p>
            O saldo de eventos simulados no período é {currency(payments.net_amount)}:
            pré-pagamentos menos estornos. Um estorno de pagamento anterior ao período pode tornar
            esse valor negativo. Pagamentos presenciais não são registrados como recebidos.
          </p>
        )}
        </details>
      </div>
      {/* Com um só bloco visível (Lojista ou Hotel/Sitter), ele ocupa a largura toda. */}
      <div className={`grid gap-6 ${showOrders && showAppointments ? "lg:grid-cols-2" : ""}`}>
        {[
          ["Pedidos por estado", data.orders.by_status, showOrders],
          ["Agendamentos por estado", data.appointments.by_status, showAppointments],
        ].map(
          ([title, values, visible]) =>
            visible && (
              <Card key={String(title)}>
                <CardHeader>
                  <CardTitle>{String(title)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(values as object).length ? (
                    <dl className="flex flex-wrap gap-2">
                      {Object.entries(values as Record<string, number>).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <dt>
                            <StatusPill status={status} />
                          </dt>
                          <dd className="text-base font-bold text-slate-900">{count}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p>Nenhum registro no período.</p>
                  )}
                </CardContent>
              </Card>
            )
        )}
        {showAppointments && (
          <Card>
            <CardHeader>
              <CardTitle>Serviços dos agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.service_mix.length ? (
                <ul className="space-y-2">
                  {data.service_mix.map((item) => (
                    <li key={item.id} className="flex justify-between gap-4">
                      <span className="min-w-0 break-words">{item.name}</span>
                      <span>{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum serviço contratado no período.</p>
              )}
              <p className="mt-3 text-xs text-slate-600">
                Inclui todos os estados, também recusas e cancelamentos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {financial && showOrders && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas reconhecidas por dia de criação</CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenue.paid_orders ? (
              <div className="h-64 min-w-0" aria-label="Gráfico de vendas reconhecidas">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={day} minTickGap={35} />
                    <YAxis width={75} />
                    <Tooltip
                      labelFormatter={(value) => day(String(value))}
                      formatter={(value) => [currency(Number(value)), "Vendas"]}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0369a1" fill="#e0f2fe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>Nenhuma venda reconhecida no período.</p>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">Consultar valores diários</summary>
              <div className="max-h-64 overflow-auto">
                <table className="mt-3 w-full text-left text-sm">
                  <caption className="sr-only">Vendas reconhecidas por dia em reais</caption>
                  <thead>
                    <tr>
                      <th scope="col">Dia</th>
                      <th scope="col">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.revenue.daily.map((row) => (
                      <tr key={row.date}>
                        <td>{day(row.date)}</td>
                        <td>{currency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <p className="mt-3 text-xs text-slate-600">
              Do total, {currency(data.revenue.gateway_orders_amount)} possuem tentativa aprovada no
              Mercado Pago Sandbox. Não há repasse ou taxa de plataforma calculados aqui.
            </p>
          </CardContent>
        </Card>
      )}
      {role && (
        <div className="grid gap-6">
          {showOrders && (
            <Recent
              title="Pedidos recentes"
              items={data.recent_orders.map((row) => ({
                ...row,
                // Mesmo formato do histórico do Tutor (#ABCD1234).
                name: `Pedido #${row.id.slice(0, 8).toUpperCase()}`,
              }))}
            />
          )}
          {showAppointments && (
            <Recent
              title="Agendamentos recentes"
              items={data.recent_appointments.map((row) => ({ ...row, name: row.service.name }))}
            />
          )}
        </div>
      )}
    </section>
  );
}
function Recent({
  title,
  items,
}: {
  title: string;
  items: {
    id: string;
    name: string;
    status: string;
    total_price: number;
    created_at: string;
    start_time?: string;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-slate-600">
          Até dez registros, ordenados pela criação. Os totais acima consideram todo o período.
        </p>
        {items.length ? (
          <ul className="divide-y divide-slate-200">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="break-words font-semibold">{item.name}</p>
                  <p>{dateTime(item.created_at)}</p>
                  {item.start_time && <p>Atendimento em {dateTime(item.start_time)}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <StatusPill status={item.status} />
                  <p className="font-semibold">{currency(item.total_price)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum registro no período.</p>
        )}
      </CardContent>
    </Card>
  );
}
