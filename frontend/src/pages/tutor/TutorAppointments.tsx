import { useState } from "react";
import { Hotel, Footprints, Calendar, Clock, MapPin } from "lucide-react";

const mockHotels = [
  { id: 1, partnerName: "Hotel Fazenda Pet", petName: "Rex", dateIn: "2026-03-10", dateOut: "2026-03-15", status: "Confirmado", price: "R$ 450,00" },
  { id: 2, partnerName: "Vila dos Cães", petName: "Luna", dateIn: "2026-04-01", dateOut: "2026-04-03", status: "Pendente", price: "R$ 180,00" },
];

const mockSitters = [
  { id: 3, partnerName: "Ana Silva", petName: "Bolinha", date: "2026-03-12", time: "14:00 - 15:00", status: "Confirmado", price: "R$ 50,00" },
  { id: 4, partnerName: "Carlos Pereira", petName: "Bolinha", date: "2026-03-14", time: "10:00 - 11:30", status: "Concluído", price: "R$ 75,00" },
];

export function TutorAppointments() {
  const [activeTab, setActiveTab] = useState<"hotels" | "sitters">("hotels");

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Agendamentos</h1>
          <p className="text-slate-500 mt-2">Acompanhe suas reservas de hotéis e passeios agendados.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("hotels")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === "hotels"
                ? "bg-white text-[var(--color-primary-600)] shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <Hotel className="w-5 h-5" />
            Hotéis
          </button>
          <button
            onClick={() => setActiveTab("sitters")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === "sitters"
                ? "bg-white text-[var(--color-primary-600)] shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <Footprints className="w-5 h-5" />
            Pet Sitters
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
          <div className="space-y-4">
            {(activeTab === "hotels" ? mockHotels : mockSitters).length === 0 ? (
              <div className="text-center py-10 text-slate-500">Nenhum agendamento encontrado para esta categoria.</div>
            ) : (
              (activeTab === "hotels" ? mockHotels : mockSitters).map((item) => (
                 <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border border-slate-100 hover:border-[var(--color-primary-200)] hover:shadow-md transition-all gap-4">
                    <div className="flex gap-4">
                      <div className="hidden sm:flex h-12 w-12 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-500)] items-center justify-center shrink-0 mt-1">
                        {activeTab === "hotels" ? <Hotel className="w-6 h-6" /> : <Footprints className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{item.partnerName}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-2">Pet: <span className="text-slate-700">{item.petName}</span></p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          {activeTab === "hotels" ? (
                            <>
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-700"><Calendar className="w-3.5 h-3.5"/> In: {new Date((item as any).dateIn!).toLocaleDateString('pt-BR')}</span>
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-700"><Calendar className="w-3.5 h-3.5"/> Out: {new Date((item as any).dateOut!).toLocaleDateString('pt-BR')}</span>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-700"><Calendar className="w-3.5 h-3.5"/> {new Date((item as any).date!).toLocaleDateString('pt-BR')}</span>
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-700"><Clock className="w-3.5 h-3.5"/> {(item as any).time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 gap-2">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                         item.status === 'Confirmado' ? 'bg-green-50 text-green-700 border-green-200' : 
                         item.status === 'Pendente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                         'bg-slate-100 text-slate-600 border-slate-200'
                       }`}>
                         {item.status}
                       </span>
                       <span className="font-bold text-slate-900 text-lg">{item.price}</span>
                    </div>
                 </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
