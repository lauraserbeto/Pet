import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CheckCircle2,
  CircleDashed,
  Activity,
  Calendar
} from 'lucide-react';

// --- Dados Mockados ---

const mockKPIs = {
  available: 12450.00,
  pending: 3250.50,
  monthlyGross: 18700.50,
};

const mockChartData = [
  { label: 'Out', percentage: 45, amount: 'R$ 8.415' },
  { label: 'Nov', percentage: 60, amount: 'R$ 11.220' },
  { label: 'Dez', percentage: 85, amount: 'R$ 15.895' },
  { label: 'Jan', percentage: 50, amount: 'R$ 9.350' },
  { label: 'Fev', percentage: 75, amount: 'R$ 14.025' },
  { label: 'Mar', percentage: 100, amount: 'R$ 18.700' },
];

type TransactionType = 'Entrada' | 'Saída' | 'Saque';
type TransactionStatus = 'Concluído' | 'Pendente';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
}

const mockTransactions: Transaction[] = [
  { id: 'TXN-9082', date: '2026-03-07T14:30:00', description: 'Hospedagem - Rex (3 diárias)', type: 'Entrada', status: 'Concluído', amount: 450.00 },
  { id: 'TXN-9081', date: '2026-03-06T09:15:00', description: 'Saque para conta bancária final 3321', type: 'Saque', status: 'Concluído', amount: -1500.00 },
  { id: 'TXN-9080', date: '2026-03-05T16:45:00', description: 'Venda - Ração Golden Premium 15kg', type: 'Entrada', status: 'Concluído', amount: 210.00 },
  { id: 'TXN-9079', date: '2026-03-04T10:00:00', description: 'Creche - Bella (Pacote Mensal)', type: 'Entrada', status: 'Pendente', amount: 600.00 },
  { id: 'TXN-9078', date: '2026-03-02T11:20:00', description: 'Taxa de plataforma (Pet)', type: 'Saída', status: 'Concluído', amount: -45.50 },
  { id: 'TXN-9077', date: '2026-03-01T08:30:00', description: 'Banho e Tosa - Thor', type: 'Entrada', status: 'Concluído', amount: 120.00 },
  { id: 'TXN-9076', date: '2026-02-28T15:10:00', description: 'Consulta Veterinária - Mia', type: 'Entrada', status: 'Concluído', amount: 180.00 },
];

// --- Utilitários ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function Finance() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financeiro</h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe seus rendimentos, histórico de transações e solicite saques.
            </p>
          </div>
          <button 
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium transition-all hover:opacity-90 active:scale-95 shadow-md shadow-primary-500/20"
            style={{ backgroundColor: 'var(--color-primary-500, #3b82f6)' }}
          >
            <Wallet className="w-5 h-5" />
            Solicitar Saque
          </button>
        </header>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Saldo Disponível */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600 ring-4 ring-green-50/50">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Saldo Disponível</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {formatCurrency(mockKPIs.available)}
                </h3>
              </div>
            </div>
          </div>

          {/* A Receber (Pendente) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500 ring-4 ring-amber-50/50">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">A Receber (Pendente)</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {formatCurrency(mockKPIs.pending)}
                </h3>
              </div>
            </div>
          </div>

          {/* Receita Bruta */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 rounded-xl ring-4" style={{ backgroundColor: 'var(--color-primary-50, #eff6ff)', color: 'var(--color-primary-500, #3b82f6)', boxShadow: '0 0 0 4px var(--color-primary-50, #eff6ff)' }}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Receita Bruta (Mês)</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {formatCurrency(mockKPIs.monthlyGross)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Area */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 lg:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-800">Receita nos últimos 6 meses</h2>
              </div>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100 min-h-[250px]">
              {mockChartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-20">
                    {item.amount}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                  
                  {/* Container da Barra */}
                  <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg relative overflow-hidden flex flex-col justify-end h-full">
                    {/* Barra Animada */}
                    <div 
                      className="w-full rounded-t-lg transition-all duration-700 ease-out group-hover:opacity-85"
                      style={{ 
                        height: `${item.percentage}%`,
                        backgroundColor: 'var(--color-primary-500, #3b82f6)'
                      }}
                    />
                  </div>
                  
                  {/* Rótulo */}
                  <span className="text-xs font-medium text-slate-500 mt-3">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-800">Últimas Transações</h2>
              </div>
              <button className="text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-200">
                <Download className="w-4 h-4" />
                Exportar Extrato
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="font-semibold p-4 pl-6">Data</th>
                    <th className="font-semibold p-4">Descrição</th>
                    <th className="font-semibold p-4">Status</th>
                    <th className="font-semibold p-4 text-right pr-6">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockTransactions.map((tx) => {
                    const [datePart, timePart] = formatDate(tx.date).split(' ');
                    const isPositive = tx.amount > 0;
                    
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="text-sm text-slate-800 font-medium">{datePart}</div>
                          <div className="text-xs text-slate-400">{timePart}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-800 font-medium">{tx.description}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            {tx.type === 'Entrada' && <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />}
                            {tx.type === 'Saída' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                            {tx.type === 'Saque' && <Wallet className="w-3.5 h-3.5 text-slate-400" />}
                            {tx.type}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            tx.status === 'Concluído' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {tx.status === 'Concluído' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDashed className="w-3.5 h-3.5" />}
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className={`text-sm font-bold ${
                            isPositive ? 'text-green-600' : 'text-slate-700'
                          }`}>
                            {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
                Ver todo o histórico
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
