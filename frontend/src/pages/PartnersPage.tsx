import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Star,
  Shield,
  Briefcase,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
  CheckCircle2,
  Store,
  Heart,
  Activity,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "../components/ui/button";
import partnerCtaImage from "../assets/pet_shop_partner_cta.png";

export function PartnersPage() {
  const [activeTab, setActiveTab] = useState<"petshop" | "clinic" | "sitter">("petshop");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Como funciona a parceria com o Pet+?",
      a: "O Pet+ conecta seu pet shop, clínica ou serviço independente a milhares de tutores na sua região. Fornecemos um painel de controle completo (Dashboard) onde você gerencia sua agenda, prontuários, vendas, produtos e recebe pagamentos de forma simplificada."
    },
    {
      q: "Quais são as taxas cobradas pela plataforma?",
      a: "A adesão à plataforma é 100% gratuita. Cobramos apenas uma pequena comissão sobre os serviços agendados e produtos vendidos diretamente através do aplicativo. Entre em contato com nosso time para conhecer a tabela detalhada para a sua categoria."
    },
    {
      q: "Como e quando recebo pelos meus serviços?",
      a: "Os pagamentos são processados de forma totalmente segura. Os valores dos serviços prestados e produtos vendidos são acumulados na sua carteira digital Pet+ e transferidos diretamente para sua conta bancária cadastrada semanalmente ou sob demanda."
    },
    {
      q: "Preciso ter CNPJ para me cadastrar?",
      a: "Para Pet Shops e Clínicas Veterinárias, exigimos CNPJ ativo e documentação regularizada. Para cuidadores independentes (Pet Sitters e Walkers), permitimos o cadastro utilizando CPF, passando por uma verificação de perfil e antecedentes para garantir a segurança."
    }
  ];

  const pillarContent = {
    petshop: {
      title: "Pet Shops & Estética Pet",
      desc: "Maximize a ocupação da sua agenda de banho, tosa e tratamentos estéticos enquanto reduz faltas com nosso sistema de confirmações automáticas.",
      features: [
        "Agenda de serviços integrada com múltiplos profissionais",
        "Lembretes via WhatsApp automáticos para tutores",
        "Venda cruzada de produtos no checkout de serviços",
        "Gestão simplificada de recorrência e pacotes mensais"
      ],
      icon: Store,
      color: "bg-orange-500",
      accentText: "text-orange-500"
    },
    clinic: {
      title: "Clínicas & Médicos Veterinários",
      desc: "Gerencie prontuários, receitas digitais, agendamentos de exames e consultas de forma ágil e em total conformidade técnica.",
      features: [
        "Prontuário eletrônico completo com histórico de anamnese",
        "Emissão de receitas, laudos e atestados digitais",
        "Controle vacinal inteligente com avisos de revacinação",
        "Perfil profissional em destaque nas buscas especializadas"
      ],
      icon: Activity,
      color: "bg-orange-600",
      accentText: "text-orange-600"
    },
    sitter: {
      title: "Hotéis, Pet Sitters & Walkers",
      desc: "Construa sua reputação na maior rede de cuidadores do país. Gerencie estadias e passeios com relatórios de atividades em tempo real para os tutores.",
      features: [
        "Check-in e check-out digital de hospedagem",
        "Diário de bordo (fotos, alimentação, comportamento e xixi)",
        "Seguro veterinário incluso para passeios e hospedagens",
        "Sistema de avaliações transparente para impulsionar suas contratações"
      ],
      icon: Heart,
      color: "bg-amber-500",
      accentText: "text-amber-500"
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-800 overflow-hidden font-[family-name:var(--font-body)]">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-orange-50/30 to-white border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight font-[family-name:var(--font-display)]">
                Leve a gestão do seu <br />
                <span className="text-[var(--color-primary-500)]">
                  negócio pet para o futuro
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Conectamos pet shops, clínicas e profissionais autônomos à maior plataforma de cuidados do país. Economize tempo de administração, elimine faltas e multiplique seu faturamento.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-orange-500/10 transition-all hover:scale-105 active:scale-95">
                    Começar Cadastro Grátis
                  </Button>
                </Link>
                <a href="#solucoes">
                  <Button size="lg" variant="outline" className="border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950 h-14 px-8 rounded-xl">
                    Ver Soluções
                  </Button>
                </a>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 max-w-xl">
                {[
                  { value: "+150k", label: "Agendamentos" },
                  { value: "4.9★", label: "Satisfação Média" },
                  { value: "98%", label: "Eficiência de Agenda" }
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-2xl sm:text-3xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Mockup Representation */}
            <div className="lg:col-span-5 relative flex items-center justify-center mt-12 lg:mt-0 px-8">
              {/* Playful background blobs behind image */}
              <div className="absolute inset-0 bg-orange-100/50 rounded-[40%_60%_70%_30%_/_40%_55%_45%_60%] blur-sm -z-10 scale-105 animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-0 bg-amber-50/80 rounded-[50%_30%_60%_40%_/_30%_60%_40%_70%] -z-10 scale-95 animate-[spin_25s_linear_infinite_reverse]" />

              {/* Polka dot grid decoration */}
              <div className="absolute -top-10 -right-6 w-24 h-24 bg-[radial-gradient(#fdba74_2.5px,transparent_2.5px)] [background-size:14px_14px] opacity-40 pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[radial-gradient(#fed7aa_2.5px,transparent_2.5px)] [background-size:14px_14px] opacity-40 pointer-events-none" />

              {/* Wavy SVG path decor (squiggle) */}
              <div className="absolute -top-14 left-12 text-orange-300 w-16 h-16 pointer-events-none select-none">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current stroke-[4] stroke-linecap-round">
                  <path d="M10,50 Q30,20 50,50 T90,50" />
                </svg>
              </div>

              {/* Organic Pebble Image Container */}
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-[30%_70%_60%_40%_/_45%_55%_45%_55%] overflow-hidden border-8 border-white shadow-xl bg-orange-50/30 group transition-all duration-700 hover:rounded-[50%_50%_50%_50%_/_50%_50%_50%_50%]">
                <img
                  src={partnerCtaImage}
                  alt="Seja um parceiro Pet+"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITIONS SECTION */}
      <section id="solucoes" className="py-20 lg:py-28 bg-slate-50/50 relative border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
              Uma ferramenta inteligente para <br />
              <span className="text-[var(--color-primary-500)]">cada tipo de negócio</span>
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto font-medium">
              Desenvolvemos painéis dedicados com funcionalidades específicas para o seu segmento pet.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-12">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-sm">
              {[
                { id: "petshop", label: "Pet Shop & Estética", icon: Store },
                { id: "clinic", label: "Clínicas & Vets", icon: Activity },
                { id: "sitter", label: "Cuidadores & Hotéis", icon: Heart }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabs Content */}
          <div className="max-w-5xl mx-auto bg-white border border-slate-200/60 rounded-[2.5rem] p-8 sm:p-12 shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              <div className="space-y-6">
                <div className={`h-12 w-12 rounded-2xl ${pillarContent[activeTab].color} flex items-center justify-center text-white shadow-md`}>
                  {(() => {
                    const Icon = pillarContent[activeTab].icon;
                    return <Icon className="h-6 w-6" />;
                  })()}
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {pillarContent[activeTab].title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed font-medium">
                  {pillarContent[activeTab].desc}
                </p>

                <ul className="space-y-3.5">
                  {pillarContent[activeTab].features.map((feature, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${pillarContent[activeTab].accentText}`} />
                      <span className="text-sm sm:text-base text-slate-600 font-semibold">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Presentation inside tab */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-50 border border-slate-200/80 shadow-inner flex flex-col p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-6">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Painel do Parceiro Pet+</span>
                </div>

                {/* Dashboard layout emulation */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Agendamentos Hoje</span>
                    <span className="text-2xl font-black text-slate-900 mt-2">12</span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1">▲ 8% hoje</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Ticket Médio</span>
                    <span className="text-2xl font-black text-slate-900 mt-2">R$ 135</span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1">Serviços e produtos</span>
                  </div>
                  <div className="col-span-2 bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col gap-3 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Próximos Clientes</span>
                    <div className="space-y-2">
                      {[
                        { pet: "Pipoca (Shih Tzu)", time: "14:00", service: "Tosa Higiênica" },
                        { pet: "Max (Gato Persa)", time: "15:30", service: "Consulta Geral" }
                      ].map((appt, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                          <span className="font-bold text-slate-800">{appt.pet}</span>
                          <span className="text-slate-500 font-medium">{appt.service}</span>
                          <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-black border border-orange-100">{appt.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. PLATFORM FEATURES / HIGHLIGHTS */}
      <section className="py-20 lg:py-28 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                title: "Visibilidade Geolocalizada",
                desc: "Apareça nas buscas de milhares de tutores ativos na sua região exata e atraia clientes qualificados.",
                icon: Users,
                color: "text-orange-500 bg-orange-50 border-orange-100"
              },
              {
                title: "Faturamento Sem Complicação",
                desc: "Recebimento garantido com faturamento transparente e direto na sua conta bancária cadastrada semanalmente.",
                icon: TrendingUp,
                color: "text-orange-600 bg-orange-50/60 border-orange-100"
              },
              {
                title: "Segurança de Dados",
                desc: "Ambiente digital seguro em conformidade com a LGPD e suporte prioritário dedicado ao parceiro.",
                icon: Award,
                color: "text-amber-600 bg-amber-50 border-amber-100"
              }
            ].map((highlight, i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-3xl p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${highlight.color} transition-transform group-hover:scale-110 duration-300`}>
                  <highlight.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-[family-name:var(--font-display)]">{highlight.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{highlight.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. THE ULTIMATE CTA BLOCK */}
      <section className="relative my-16 mx-4 sm:mx-8 lg:mx-auto max-w-5xl bg-[#fffaf7] border border-orange-100 rounded-[2.5rem] p-8 sm:p-12 lg:p-14 overflow-hidden shadow-xs">
        
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] leading-tight tracking-tight">
            Pronto para expandir o seu{" "}
            <span className="text-[var(--color-primary-500)]">
              negócio pet?
            </span>
          </h2>
          
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-semibold">
            Junte-se a centenas de pet shops e clínicas parceiras que crescem todos os dias no Pet+. Cadastre-se em menos de 10 minutos.
          </p>

          {/* Centered Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 max-w-4xl mx-auto">
            {[
              {
                title: "Agenda Inteligente",
                desc: "Evite horários vazios com notificações e agendamento automático 24/7.",
                icon: Calendar,
                iconClass: "rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/20",
              },
              {
                title: "Dashboard de Faturamento",
                desc: "Monitore suas vendas, serviços prestados e faturamento em tempo real.",
                icon: TrendingUp,
                iconClass: "rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/20",
              },
              {
                title: "Alcance Maximizado",
                desc: "Seu estabelecimento destacado nas buscas de tutores em toda a sua região.",
                icon: Users,
                iconClass: "rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-md shadow-orange-600/20",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx} 
                  className="flex flex-col items-center text-center"
                >
                  <div className={`w-14 h-14 flex items-center justify-center ${item.iconClass}`}>
                    <Icon className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-slate-900 font-extrabold text-base mt-4 leading-snug">{item.title}</h4>
                  <p className="text-slate-500 text-xs mt-2 max-w-xs leading-relaxed font-semibold">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Centered Single CTA Button */}
          <div className="flex justify-center pt-4">
            <Link to="/register">
              <Button size="lg" className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold h-13 px-8 rounded-xl shadow-lg shadow-orange-500/10 hover:scale-[1.02] transition-all">
                Cadastrar meu Negócio
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-600 font-medium">
              Tudo o que você precisa saber sobre a nossa parceria de negócios.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="font-bold text-slate-900 text-base pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-orange-500" : ""
                      }`}
                    />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-6 pt-0 border-t border-slate-100 text-slate-600 text-sm leading-relaxed font-semibold bg-slate-50/50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
}

export default PartnersPage;
