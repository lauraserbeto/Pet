import { motion } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import {
  PawPrint,
  Heart,
  Shield,
  Target,
  Users,
  Hotel,
  ShoppingBag,
  Dog,
  Sparkles,
  TrendingUp,
  Globe,
} from "lucide-react";
import { Link } from "react-router";

/* ─── Data ─── */
const milestones = [
  {
    year: "2023",
    text: "Identificamos a carência de um hub centralizado para o setor pet. Nossa solução une a curadoria de serviços confiáveis a uma ferramenta de gestão estratégica de fornecedores.",
  },
  { year: "2025", text: "Criação de nossa plataforma web." },
];

const values = [
  {
    icon: Heart,
    title: "Amor pelos animais",
    description:
      "Cada funcionalidade é pensada para o bem-estar do pet e a tranquilidade do tutor.",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: Shield,
    title: "Segurança e confiança",
    description: "Análise cadastral de parceiros e avaliações vinculadas às compras e aos atendimentos concluídos.",
    color: "bg-blue-50 text-blue-500",
  },
  {
    icon: Users,
    title: "Comunidade",
    description:
      "Conectamos tutores apaixonados a profissionais rigorosamente selecionados e dedicados ao cuidado animal.",
    color: "bg-teal-50 text-teal-500",
  },
  {
    icon: Sparkles,
    title: "Inovação",
    description:
      "Tecnologia de ponta para tornar a experiência pet cada vez mais simples e prática.",
    color: "bg-amber-50 text-amber-500",
  },
];

const features = [
  {
    icon: Hotel,
    title: "Hotelaria Pet",
    description:
      "Consulte os serviços, as condições e as comodidades informadas por cada hotel antes de solicitar uma hospedagem.",
    link: "/hotels",
  },
  {
    icon: PawPrint,
    title: "Pet Sitter",
    description:
      "Profissionais qualificados que cuidam do seu pet com carinho, seja em passeios diários ou cuidados em domicílio.",
    link: "/walkers",
  },
  {
    icon: ShoppingBag,
    title: "Shopping Pet",
    description:
      "Produtos de lojas parceiras, de ração a brinquedos, com a entrega combinada com cada loja.",
    link: "/shopping",
  },
];

const goals = [
  {
    icon: TrendingUp,
    title: "1 milhão de tutores",
    description: "Meta de alcançar 1 milhão de tutores ativos até o final de 2030.",
  },
  {
    icon: Globe,
    title: "Presença nacional",
    description: "Estar presente em todas as capitais brasileiras com parceiros verificados.",
  },
  {
    icon: Dog,
    title: "Adoção responsável",
    description: "Lançar programa de apoio à adoção conectando ONGs a famílias preparadas.",
  },
];

/* ─── Helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ─── Component ─── */
export function AboutPage() {
  return (
    <div className="font-[family-name:var(--font-body)] overflow-x-hidden">
      {/* ═══════ Hero ═══════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary-500)] via-[var(--color-primary-400)] to-amber-400">
        {/* Decorative shapes */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-48 sm:w-72 h-48 sm:h-72 rounded-full bg-white" />
          <div className="absolute bottom-0 right-0 w-56 sm:w-96 h-56 sm:h-96 rounded-full bg-white translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full mb-4 sm:mb-6">
                <PawPrint className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Sobre o Pet+
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white font-[family-name:var(--font-display)] leading-tight">
                Cuidar é a nossa <span className="text-amber-200">missão</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/90 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Nascemos da paixão por animais e da vontade de tornar a vida de tutores e pets mais
                simples, segura e feliz.
              </p>

              {/* Stats — mobile only */}
              <div className="flex justify-center lg:hidden gap-6 mt-6">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                  <p className="font-extrabold text-white text-xl">10k+</p>
                  <p className="text-[11px] text-white/70">Tutores ativos</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                  <p className="font-extrabold text-white text-xl">500+</p>
                  <p className="text-[11px] text-white/70">Parceiros</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 mt-6 sm:mt-8">
                <Link
                  to="/hotels"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary-700)] font-bold px-5 sm:px-6 py-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-orange-600/20 text-sm sm:text-base"
                >
                  <Hotel className="h-4 w-4 sm:h-5 sm:w-5" />
                  Explorar serviços
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm text-white font-bold px-5 sm:px-6 py-3 rounded-xl border border-white/30 hover:bg-white/25 transition-colors text-sm sm:text-base"
                >
                  Seja um parceiro
                </Link>
              </div>
            </motion.div>

            {/* Image — mobile: compact, desktop: full */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Mobile / Tablet image */}
              <div className="lg:hidden rounded-2xl overflow-hidden shadow-xl mx-auto max-w-sm">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1727379819078-65e02ff69f5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBoYXBweSUyMG91dGRvb3IlMjBuYXR1cmV8ZW58MXx8fHwxNzcyMTEzNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Pet feliz"
                  className="w-full h-48 sm:h-64 object-cover"
                />
              </div>

              {/* Desktop image */}
              <div className="hidden lg:block">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-orange-800/30">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1727379819078-65e02ff69f5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBoYXBweSUyMG91dGRvb3IlMjBuYXR1cmV8ZW58MXx8fHwxNzcyMTEzNDI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Pet feliz"
                    className="w-full h-[420px] object-cover"
                  />
                </div>
                {/* Floating cards — desktop only */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Users className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-lg">10k+</p>
                    <p className="text-xs text-slate-500">Tutores ativos</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ Nossa História (Timeline) ═══════ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            custom={0}
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
          >
            <span className="inline-flex items-center gap-1.5 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-3 sm:mb-4">
              <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Nossa história
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
              Uma proposta para aproximar tutores e parceiros
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 leading-relaxed px-2">
              O Pet+ nasceu da visão de quatro graduandos de Engenharia de Software que, ao
              identificarem as lacunas e a fragmentação do mercado pet, decidiram aplicar a
              tecnologia para simplificar esse universo. O que começou como um projeto acadêmico
              focado em solucionar problemas reais, transformou-se em uma experiência digital
              integrada que converte a complexidade do setor em facilidade. Por meio de uma
              plataforma web acessível, conectamos o desejo de cuidado dos tutores à eficiência
              operacional de parceiros e especialistas. Somos o ponto de encontro onde a gestão
              inteligente encontra a dedicação animal, promovendo um mercado mais organizado,
              profissional e confiável.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* ── Mobile: left-aligned line ── */}
            <div className="md:hidden absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--color-primary-200)] via-[var(--color-primary-400)] to-[var(--color-secondary-400)]" />

            {/* ── Desktop: center line ── */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--color-primary-200)] via-[var(--color-primary-400)] to-[var(--color-secondary-400)]" />

            <div className="space-y-8 md:space-y-0">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  custom={i}
                  className={`relative md:flex md:items-center md:mb-16 last:md:mb-0 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* ── Mobile: dot + card ── */}
                  <div className="md:hidden flex items-start gap-4 pl-1">
                    {/* Dot */}
                    <div className="relative z-10 mt-5 w-3.5 h-3.5 shrink-0 rounded-full bg-[var(--color-primary-500)] border-[3px] border-white shadow-md" />
                    {/* Card */}
                    <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <span className="inline-block bg-gradient-to-r from-[var(--color-primary-700)] to-amber-400 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-lg mb-2">
                        {m.year}
                      </span>
                      <p className="text-sm text-slate-600 leading-relaxed">{m.text}</p>
                    </div>
                  </div>

                  {/* ── Desktop: alternating sides ── */}
                  <div className="hidden md:block md:w-1/2 md:px-10">
                    <div
                      className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${
                        i % 2 === 0 ? "md:text-right" : "md:text-left"
                      }`}
                    >
                      <span className="inline-block bg-gradient-to-r from-[var(--color-primary-700)] to-amber-400 text-white font-extrabold text-sm px-3 py-1 rounded-lg mb-3">
                        {m.year}
                      </span>
                      <p className="text-slate-600 leading-relaxed">{m.text}</p>
                    </div>
                  </div>

                  {/* Desktop dot */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[var(--color-primary-500)] border-4 border-white shadow-md z-10" />

                  {/* Spacer */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Valores ═══════ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            custom={0}
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
          >
            <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-600 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-3 sm:mb-4">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Nossos valores
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
              O que nos guia todos os dias
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div
                  className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 ${v.color}`}
                >
                  <v.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1 sm:mb-2 text-sm sm:text-base font-[family-name:var(--font-display)]">
                  {v.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Funcionalidades ═══════ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-1.5 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-3 sm:mb-4">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> O que oferecemos
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] leading-tight">
                Tudo para o seu pet em um só lugar
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 leading-relaxed max-w-md mx-auto lg:mx-0">
                A Pet+ reúne os melhores serviços e produtos para o cuidado do seu animal de
                estimação, com segurança, praticidade e muito amor.
              </p>

              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-5">
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                  >
                    <Link
                      to={f.link}
                      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white hover:border-[var(--color-primary-200)] hover:shadow-md transition-all group text-left"
                    >
                      <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-50)] text-[var(--color-primary-500)] group-hover:scale-110 transition-transform shrink-0">
                        <f.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 mb-0.5 sm:mb-1 text-sm sm:text-base font-[family-name:var(--font-display)]">
                          {f.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Images — visible on all sizes, layout adapts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Mobile: horizontal scroll strip */}
              <div tabIndex={0} role="region" aria-label="Galeria de fotos (role para o lado)" className="lg:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)]">
                <div className="shrink-0 w-[70%] sm:w-[45%] snap-start rounded-xl overflow-hidden shadow-md">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1700665537650-1bf37979aae0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY2FyaW5nJTIwZG9ncyUyMHBldHMlMjB2ZXRlcmluYXJ5fGVufDF8fHx8MTc3MjExMzQyMnww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Cuidado veterinário"
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                </div>
                <div className="shrink-0 w-[70%] sm:w-[45%] snap-start rounded-xl overflow-hidden shadow-md">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1762062313691-08284928e5b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMG93bmVyJTIwd2Fsa2luZyUyMHBhcmt8ZW58MXx8fHwxNzcyMDc0NzA5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Passeio com pet"
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                </div>
                <div className="shrink-0 w-[70%] sm:w-[45%] snap-start rounded-xl overflow-hidden shadow-md">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1735597403677-2029485b4547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZyUyMGNhcmUlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcyMTEzNDIzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Pet grooming"
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                </div>
              </div>

              {/* Desktop: masonry-style grid */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1700665537650-1bf37979aae0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY2FyaW5nJTIwZG9ncyUyMHBldHMlMjB2ZXRlcmluYXJ5fGVufDF8fHx8MTc3MjExMzQyMnww&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Cuidado veterinário"
                      className="w-full h-56 object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1735597403677-2029485b4547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZyUyMGNhcmUlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcyMTEzNDIzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Pet grooming"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1762062313691-08284928e5b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMG93bmVyJTIwd2Fsa2luZyUyMHBhcmt8ZW58MXx8fHwxNzcyMDc0NzA5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Passeio com pet"
                      className="w-full h-40 object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&auto=format&fit=crop&q=80"
                      alt="Hotel pet"
                      className="w-full h-56 object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ Metas ═══════ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-28 sm:w-40 h-28 sm:h-40 rounded-full bg-[var(--color-primary-400)]" />
          <div className="absolute bottom-10 right-10 w-40 sm:w-60 h-40 sm:h-60 rounded-full bg-[var(--color-secondary-400)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            custom={0}
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
          >
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-amber-300 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full mb-3 sm:mb-4">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Nossas metas
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-[family-name:var(--font-display)]">
              Para onde estamos caminhando
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-400 leading-relaxed px-2">
              Nosso propósito vai além de uma plataforma. Queremos construir um ecossistema que
              melhore a vida de pets e tutores em todo o Brasil.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {goals.map((g, i) => (
              <motion.div
                key={g.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-white/10 transition-colors text-center"
              >
                <div className="inline-flex p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 text-amber-300 mb-3 sm:mb-4">
                  <g.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <h3 className="font-bold text-white mb-1.5 sm:mb-2 text-base sm:text-lg font-[family-name:var(--font-display)]">
                  {g.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{g.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA Final ═══════ */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="bg-gradient-to-br from-[var(--color-primary-50)] via-amber-50 to-[var(--color-secondary-50)] rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 border border-orange-100">
              <PawPrint className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--color-primary-500)] mx-auto mb-3 sm:mb-4" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                Faça parte da família Pet+
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
                Seja como tutor ou parceiro, o Pet+ é o lugar certo para quem ama animais e busca o
                melhor para eles.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-800)] text-white font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-colors shadow-lg shadow-orange-200 text-sm sm:text-base"
                >
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
