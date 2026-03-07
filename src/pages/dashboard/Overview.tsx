import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MoreVertical, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export function Overview() {
  // Mock Data
  const appointments = [
    { id: 1, pet: "Rex", owner: "Carlos Silva", service: "Hospedagem", time: "09:00", status: "Confirmado", avatar: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop&q=60" },
    { id: 2, pet: "Luna", owner: "Ana Costa", service: "Passeio", time: "10:30", status: "Pendente", avatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&auto=format&fit=crop&q=60" },
    { id: 3, pet: "Thor", owner: "Marcos Lima", service: "Day Care", time: "11:15", status: "Concluído", avatar: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&auto=format&fit=crop&q=60" },
    { id: 4, pet: "Mel", owner: "Julia P.", service: "Hospedagem", time: "14:00", status: "Confirmado", avatar: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=100&auto=format&fit=crop&q=60" },
    { id: 5, pet: "Bob", owner: "Pedro Santos", service: "Pet Sitter", time: "15:30", status: "Pendente", avatar: "https://images.unsplash.com/photo-1588943211346-09cb96cd76ae?w=100&auto=format&fit=crop&q=60" },
  ];

  const revenueData = [
    { name: 'Seg', value: 1200 },
    { name: 'Ter', value: 2100 },
    { name: 'Qua', value: 800 },
    { name: 'Qui', value: 1600 },
    { name: 'Sex', value: 2400 },
    { name: 'Sáb', value: 3200 },
    { name: 'Dom', value: 1800 },
  ];

  const servicesData = [
    { name: 'Hospedagem', value: 45, color: '#3699D2' },
    { name: 'Passeio', value: 30, color: '#F58B05' },
    { name: 'Day Care', value: 15, color: '#10B981' },
    { name: 'Pet Sitter', value: 10, color: '#6366F1' },
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [providerData, setProviderData] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (user) {
          setUserData(user);

          // If provider (role 2, 3, or 4), fetch provider data
          if ([2, 3, 4].includes(user.role_id)) {
            const { data: provider } = await supabase
              .from('providers')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            if (provider) setProviderData(provider);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Visão Geral</h2>
          <p className="text-slate-500 mt-1">
            {isLoading ? "Carregando..." : `Bem-vindo(a), ${userData?.full_name || 'Usuário'}! Aqui está o resumo do seu negócio hoje.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden md:flex">
                <CalendarIcon className="mr-2 h-4 w-4" />
                24 de Abril, 2024
            </Button>
            <Button className="bg-[#F58B05] hover:bg-[#d67a04]">
                Novo Agendamento
            </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {providerData && (
          <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-sm font-medium text-slate-500">Seu Negócio</p>
                          <h3 className="text-xl font-bold text-slate-900 mt-2 truncate w-32" title={providerData.business_name}>
                            {providerData.business_name || 'Não informado'}
                          </h3>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          <Activity size={20} />
                      </div>
                  </div>
                  <div className="flex items-center gap-1 mt-4 text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-full">
                      <span>Status: {providerData.status}</span>
                  </div>
              </CardContent>
          </Card>
        )}

        <Card className="border-l-4 border-l-[#3699D2] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Receita Total (Mês)</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">R$ 12.450</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-[#3699D2]">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    <span>+12.5% vs mês anterior</span>
                </div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#F58B05] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Agendamentos</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">142</h3>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg text-[#F58B05]">
                        <CalendarIcon size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                    <ArrowUpRight size={12} />
                    <span>+4% vs semana passada</span>
                </div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Novos Clientes</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">24</h3>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Users size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded-full">
                    <ArrowDownRight size={12} />
                    <span>-2% vs mês anterior</span>
                </div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Ticket Médio</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">R$ 87,50</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <ShoppingBag size={20} />
                    </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
                    <ArrowUpRight size={12} />
                    <span>+5.2% vs mês anterior</span>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Receita Semanal</CardTitle>
                <CardDescription>Acompanhe o desempenho financeiro dos últimos 7 dias.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3699D2" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3699D2" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value) => `R$${value}`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`R$ ${value}`, 'Receita']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#3699D2" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>

          {/* Popular Services Chart */}
          <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Serviços Populares</CardTitle>
                <CardDescription>Distribuição dos atendimentos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                            <Pie
                                data={servicesData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {servicesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="block text-2xl font-bold text-slate-900">100%</span>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    {servicesData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-slate-600 font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-900">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
      </div>

      {/* Recent Activity & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800">Próximos Agendamentos</CardTitle>
                        <CardDescription>Agenda de hoje</CardDescription>
                    </div>
                    <Button variant="ghost" className="text-[#3699D2] hover:text-[#2d82b3] hover:bg-blue-50">Ver todos</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-[#3699D2]/30 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <Avatar src={apt.avatar} className="h-12 w-12 border-2 border-white shadow-sm" />
                                    <div>
                                        <p className="font-bold text-slate-900 text-base">{apt.pet} <span className="font-normal text-slate-500 text-sm">({apt.owner})</span></p>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Activity size={12} />
                                            {apt.service}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1 text-slate-700 font-bold">
                                            <Clock className="h-4 w-4 text-[#F58B05]" />
                                            {apt.time}
                                        </div>
                                    </div>
                                    <Badge 
                                        variant="outline"
                                        className={`
                                            ${apt.status === "Confirmado" ? "bg-green-50 text-green-700 border-green-200" : 
                                              apt.status === "Concluído" ? "bg-slate-100 text-slate-600 border-slate-200" : 
                                              "bg-amber-50 text-amber-600 border-amber-200"}
                                        `}
                                    >
                                        {apt.status}
                                    </Badge>
                                    <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-slate-600">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Recent Reviews or Alerts */}
        <div className="space-y-6">
            <Card className="bg-[#3699D2] text-white shadow-md border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">Meta Mensal</h3>
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">85% Atingida</span>
                    </div>
                    <div className="mb-2 flex items-end gap-2">
                        <span className="text-4xl font-bold">R$ 12.4k</span>
                        <span className="text-blue-100 text-sm mb-1">/ R$ 15k</span>
                    </div>
                    {/* Progress Bar Mock */}
                    <div className="w-full bg-blue-900/30 rounded-full h-2 mb-4">
                        <div className="bg-white h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-sm text-blue-100">Faltam apenas R$ 2.550 para atingir sua meta de Abril! Mantenha o ritmo.</p>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">Alertas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="p-2 bg-red-50 rounded-lg text-red-500 shrink-0">
                                <ShoppingBag size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Estoque Baixo</p>
                                <p className="text-xs text-slate-500 mt-0.5">Shampoo Neutro (500ml) está abaixo do mínimo.</p>
                                <Button variant="link" className="h-auto p-0 text-xs text-red-500 mt-1">Repor Estoque</Button>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600 shrink-0">
                                <Users size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Aniversariantes</p>
                                <p className="text-xs text-slate-500 mt-0.5">3 clientes fazem aniversário esta semana.</p>
                                <Button variant="link" className="h-auto p-0 text-xs text-yellow-600 mt-1">Enviar Mensagem</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}