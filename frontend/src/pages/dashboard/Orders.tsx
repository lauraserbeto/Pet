import React, { useState } from 'react';
import { 
  Search, 
  Package, 
  Clock, 
  DollarSign, 
  Eye, 
  ShoppingBag
} from 'lucide-react';


const mockKPIs = {
  totalOrders: 156,
  pendingOrders: 12,
  monthlyRevenue: 18700.50,
};

type OrderStatus = 'Pendente' | 'Em Separação' | 'Enviado' | 'Entregue';

interface Order {
  id: string;
  date: string;
  customer: string;
  items: string;
  total: number;
  status: OrderStatus;
}

const mockOrders: Order[] = [
  { id: '#PED-001', date: '2026-03-07T14:30:00', customer: 'João Silva', items: '2x Ração Golden 15kg', total: 240.00, status: 'Pendente' },
  { id: '#PED-002', date: '2026-03-07T10:15:00', customer: 'Maria Oliveira', items: '1x Coleira Antipulgas, 1x Brinquedo Osso', total: 85.50, status: 'Em Separação' },
  { id: '#PED-003', date: '2026-03-06T16:45:00', customer: 'Carlos Souza', items: '1x Ração Premier 12kg, 2x Sachê Whiskas', total: 215.00, status: 'Enviado' },
  { id: '#PED-004', date: '2026-03-05T09:00:00', customer: 'Ana Costa', items: '1x Cama Pet Tamanho M, 1x Shampoo Neutro', total: 150.00, status: 'Entregue' },
  { id: '#PED-005', date: '2026-03-04T11:20:00', customer: 'Pedro Santos', items: '1x Tapete Higiênico 30 un.', total: 60.00, status: 'Entregue' },
  { id: '#PED-006', date: '2026-03-03T15:30:00', customer: 'Beatriz Lima', items: '3x Ração Úmida Royal Canin', total: 45.00, status: 'Entregue' },
];


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

const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case 'Pendente':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Em Separação':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Enviado':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Entregue':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = mockOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Meus Pedidos</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie e acompanhe os pedidos da sua loja.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por ID ou Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:border-transparent transition-colors sm:text-sm"
              style={{ '--tw-ring-color': 'var(--color-primary-500, #3b82f6)' } as React.CSSProperties}
            />
          </div>
        </header>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total de Pedidos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 ring-4 ring-blue-50/50">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total de Pedidos</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {mockKPIs.totalOrders}
                </h3>
              </div>
            </div>
          </div>

          {/* Pedidos Pendentes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-500 ring-4 ring-amber-50/50">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pedidos Pendentes</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {mockKPIs.pendingOrders}
                </h3>
              </div>
            </div>
          </div>

          {/* Receita do Mês */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
               <div className="p-3 rounded-xl ring-4" style={{ backgroundColor: 'var(--color-primary-50, #eff6ff)', color: 'var(--color-primary-500, #3b82f6)', boxShadow: '0 0 0 4px var(--color-primary-50, #eff6ff)' }}>
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Receita do Mês</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1 tracking-tight">
                  {formatCurrency(mockKPIs.monthlyRevenue)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-800">Lista de Pedidos</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="font-semibold p-4 pl-6">ID Pedido</th>
                  <th className="font-semibold p-4">Data</th>
                  <th className="font-semibold p-4">Cliente</th>
                  <th className="font-semibold p-4">Itens</th>
                  <th className="font-semibold p-4">Total</th>
                  <th className="font-semibold p-4">Status</th>
                  <th className="font-semibold p-4 pr-6 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const [datePart, timePart] = formatDate(order.date).split(' ');
                    
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 pl-6">
                          <span className="text-sm font-bold text-slate-700">{order.id}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-800 font-medium">{datePart}</div>
                          <div className="text-xs text-slate-400">{timePart}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-800 font-medium">{order.customer}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-600 max-w-[200px] truncate" title={order.items}>
                            {order.items}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-slate-800">
                            {formatCurrency(order.total)}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <button 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors group-hover:text-slate-600"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum pedido encontrado com "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer of Table */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
            <span>Mostrando {filteredOrders.length} de {mockOrders.length} pedidos</span>
            <div className="flex items-center gap-2">
              <button disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 cursor-not-allowed">Anterior</button>
              <button disabled className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 cursor-not-allowed">Próximo</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
