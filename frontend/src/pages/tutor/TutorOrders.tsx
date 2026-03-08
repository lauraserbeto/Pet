import { ShoppingBag, Package, Truck, CheckCircle } from "lucide-react";

const mockOrders = [
  { id: "PED-20260308-01", date: "2026-03-08", items: "Ração Royal Canin 15kg, Brinquedo Osso", total: "R$ 380,50", status: "Em Rota de Entrega" },
  { id: "PED-20260301-88", date: "2026-03-01", items: "Coleira Antipulgas, Shampoo Pet", total: "R$ 125,90", status: "Entregue" },
];

export function TutorOrders() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Pedidos</h1>
          <p className="text-slate-500 mt-2">Histórico de compras realizadas no Pet+ Shopping.</p>
        </div>

        <div className="space-y-4">
          {mockOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-slate-500">Você ainda não realizou nenhuma compra em nosso shopping.</p>
            </div>
          ) : (
            mockOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-[var(--color-primary-200)] transition-colors">
                {/* Header Pedido */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-sm font-bold text-slate-500">Nº DO PEDIDO</span>
                    <p className="font-bold text-slate-900">{order.id}</p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <span className="text-sm font-bold text-slate-500">DATA</span>
                      <p className="font-medium text-slate-800">{new Date(order.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-500">TOTAL</span>
                      <p className="font-bold text-slate-900">{order.total}</p>
                    </div>
                  </div>
                </div>

                {/* Corpo Pedido */}
                <div className="px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Resumo dos itens</h4>
                      <p className="text-sm text-slate-600 line-clamp-2 max-w-lg mt-1">{order.items}</p>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4 border-t md:border-0 border-slate-100 pt-4 md:pt-0">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${
                      order.status === 'Entregue' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {order.status === 'Entregue' ? <CheckCircle className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      {order.status}
                    </div>
                    <button className="w-full sm:w-auto text-[var(--color-primary-600)] bg-[var(--color-primary-50)] hover:bg-[var(--color-primary-100)] px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
