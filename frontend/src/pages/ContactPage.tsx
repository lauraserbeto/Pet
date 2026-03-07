import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  ChevronRight,
  ArrowUp,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  ChevronDown,
  PawPrint,
  Headphones,
  HelpCircle,
  Building2,
  Instagram,
  Facebook,
  Twitter,
  CheckCircle2,
  User,
  AtSign,
  FileText,
  MessageSquare,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════════ */

const faqs = [
  {
    id: "faq1",
    question: "Como faço para cadastrar meu pet na plataforma?",
    answer:
      'Após criar sua conta como Tutor, acesse "Meu Perfil" e clique em "Adicionar Pet". Preencha as informações do seu animal (nome, raça, porte, idade e vacinas) e adicione uma foto. Você pode cadastrar quantos pets desejar.',
  },
  {
    id: "faq2",
    question: "Qual o prazo para resposta do atendimento?",
    answer:
      "Nosso prazo padrão de resposta é de até 24 horas úteis para e-mails e formulários. Para atendimento urgente, recomendamos o chat ao vivo (disponível de segunda a sexta, das 8h às 20h) ou o telefone.",
  },
  {
    id: "faq3",
    question: "Como funciona o cancelamento de uma reserva?",
    answer:
      "Cancelamentos com mais de 48h de antecedência têm reembolso integral. Entre 24h e 48h, o reembolso é de 50%. Com menos de 24h, não há reembolso, exceto em casos de força maior. Consulte nossos Termos de Uso para detalhes completos.",
  },
  {
    id: "faq4",
    question: "Quero ser um Parceiro Pet+. Como faço?",
    answer:
      'Clique em "Cadastre-se" e selecione o tipo de conta "Parceiro". Preencha os dados da sua empresa, envie a documentação necessária e nossa equipe analisará seu cadastro em até 5 dias úteis. Você será notificado por e-mail sobre a aprovação.',
  },
  {
    id: "faq5",
    question: "Como reportar um problema com um serviço ou produto?",
    answer:
      "Acesse a seção de pedidos/agendamentos no seu perfil, selecione o item em questão e clique em \"Reportar Problema\". Descreva a situação com detalhes e, se possível, anexe fotos. Também é possível reportar diretamente por este formulário de contato selecionando o assunto \"Reclamação\".",
  },
];

/* ═══════════════════════════════════════════════
   CONTACT INFO DATA
   ═══════════════════════════════════════════════ */

const contactChannels = [
  {
    icon: Mail,
    label: "E-mail",
    value: "contato@petmais.com.br",
    href: "mailto:contato@petmais.com.br",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Phone,
    label: "Telefone",
    value: "(11) 3000-7890",
    href: "tel:+551130007890",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "(11) 99000-7890",
    href: "https://wa.me/5511990007890",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Clock,
    label: "Horário",
    value: "Seg–Sex, 8h às 20h",
    href: undefined,
    color: "bg-amber-50 text-amber-600",
  },
];

const subjects = [
  "Selecione o assunto",
  "Dúvida sobre serviços",
  "Problema com reserva",
  "Reclamação",
  "Sugestão",
  "Quero ser Parceiro",
  "Imprensa / Parcerias",
  "Outro",
];

/* ═══════════════════════════════════════════════
   FAQ ITEM
   ═══════════════════════════════════════════════ */

function FaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left group"
        aria-expanded={isOpen}
      >
        <div
          className={`shrink-0 p-2 rounded-lg transition-colors ${
            isOpen
              ? "bg-[var(--color-primary-500)] text-white"
              : "bg-slate-100 text-slate-400 group-hover:bg-[var(--color-primary-50)] group-hover:text-[var(--color-primary-500)]"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
        </div>
        <span
          className={`flex-1 text-sm sm:text-base font-semibold transition-colors font-[family-name:var(--font-display)] ${
            isOpen ? "text-[var(--color-primary-700)]" : "text-slate-800"
          }`}
        >
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronDown
            className={`h-4 w-4 transition-colors ${
              isOpen ? "text-[var(--color-primary-500)]" : "text-slate-400"
            }`}
          />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 pt-0">
              <div className="border-t border-slate-100 pt-3">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTACT PAGE
   ═══════════════════════════════════════════════ */

export function ContactPage() {
  const [showTop, setShowTop] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject || subject === subjects[0] || !message.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setSubmitted(true);
    toast.success("Mensagem enviada com sucesso!");
  };

  const resetForm = () => {
    setSubmitted(false);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="font-[family-name:var(--font-body)] bg-slate-50 min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60 mb-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-medium">Contato</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Headphones className="h-4 w-4 text-white" />
              <span className="text-xs sm:text-sm text-white font-medium">
                Fale Conosco
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-[family-name:var(--font-display)] leading-tight">
              Como podemos ajudar?
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
              Estamos aqui para ouvir você. Tire dúvidas, envie sugestões ou entre em
              contato com nossa equipe. Responderemos o mais rápido possível!
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Contact Channels ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {contactChannels.map((ch, i) => {
            const Icon = ch.icon;
            const Wrapper = ch.href ? "a" : "div";
            const linkProps = ch.href
              ? {
                  href: ch.href,
                  target: ch.href.startsWith("http") ? "_blank" : undefined,
                  rel: ch.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined,
                }
              : {};
            return (
              <motion.div
                key={ch.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Wrapper
                  {...(linkProps as any)}
                  className={`block bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-md border border-slate-100 ${
                    ch.href
                      ? "hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                      : ""
                  }`}
                >
                  <div
                    className={`inline-flex p-2.5 rounded-xl ${ch.color} mb-3`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 mb-0.5">{ch.label}</p>
                  <p className="text-sm sm:text-base font-semibold text-slate-800 font-[family-name:var(--font-display)]">
                    {ch.value}
                  </p>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── Form + Sidebar ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Form Column */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    Envie sua mensagem
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Preencha o formulário abaixo e retornaremos em até 24h
                    úteis.
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-2">
                      Mensagem enviada!
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                      Obrigado por entrar em contato, {name.split(" ")[0]}!
                      Nossa equipe analisará sua mensagem e responderá pelo
                      e-mail informado.
                    </p>
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Enviar outra mensagem
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Name + Email row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Nome completo *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                          <AtSign className="h-3.5 w-3.5 text-slate-400" />
                          E-mail *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        Assunto *
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all appearance-none"
                      >
                        {subjects.map((s) => (
                          <option key={s} value={s} disabled={s === subjects[0]}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        Mensagem *
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        placeholder="Descreva como podemos ajudar..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all resize-none"
                      />
                      <p className="text-xs text-slate-400 mt-1 text-right">
                        {message.length}/1000
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5 transition-all"
                    >
                      <Send className="h-4 w-4" />
                      Enviar mensagem
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
            >
              {/* Map placeholder */}
              <div className="h-40 bg-gradient-to-br from-slate-200 to-slate-300 relative flex items-center justify-center">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-4 left-6 w-20 h-1 bg-slate-400 rounded" />
                  <div className="absolute top-10 left-10 w-32 h-1 bg-slate-400 rounded" />
                  <div className="absolute top-16 left-4 w-24 h-1 bg-slate-400 rounded" />
                  <div className="absolute top-4 right-8 w-16 h-1 bg-slate-400 rounded" />
                  <div className="absolute bottom-6 right-6 w-20 h-1 bg-slate-400 rounded" />
                  <div className="absolute bottom-12 left-12 w-28 h-1 bg-slate-400 rounded" />
                  {/* Vertical lines */}
                  <div className="absolute top-6 left-16 w-1 h-16 bg-slate-400 rounded" />
                  <div className="absolute top-10 right-16 w-1 h-20 bg-slate-400 rounded" />
                  <div className="absolute top-2 left-1/2 w-1 h-28 bg-slate-400 rounded" />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-violet-600 shadow-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="h-3 w-3 bg-violet-600 rotate-45 -mt-1.5" />
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Building2 className="h-5 w-5 text-violet-600" />
                  <h3 className="font-bold text-slate-900 font-[family-name:var(--font-display)]">
                    Nosso Escritório
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Av. Paulista, 1000 — 10° andar
                  <br />
                  Bela Vista, São Paulo — SP
                  <br />
                  CEP 01310-100
                </p>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
            >
              <h3 className="font-bold text-slate-900 font-[family-name:var(--font-display)] mb-3">
                Redes Sociais
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Siga a Pet+ para novidades, dicas e promoções.
              </p>
              <div className="flex gap-3">
                {[
                  {
                    icon: Instagram,
                    label: "Instagram",
                    color:
                      "bg-gradient-to-br from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700",
                  },
                  {
                    icon: Facebook,
                    label: "Facebook",
                    color:
                      "bg-blue-600 text-white hover:bg-blue-700",
                  },
                  {
                    icon: Twitter,
                    label: "X / Twitter",
                    color:
                      "bg-slate-800 text-white hover:bg-slate-900",
                  },
                ].map((social) => {
                  const SIcon = social.icon;
                  return (
                    <button
                      key={social.label}
                      onClick={() =>
                        toast.info(`Abrindo ${social.label} da Pet+`)
                      }
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${social.color}`}
                    >
                      <SIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {social.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white"
            >
              <div className="flex items-center gap-2 mb-3">
                <PawPrint className="h-5 w-5" />
                <h3 className="font-bold font-[family-name:var(--font-display)]">
                  Links Úteis
                </h3>
              </div>
              <div className="space-y-2">
                {[
                  { to: "/about", label: "Quem Somos" },
                  { to: "/terms", label: "Termos de Uso" },
                  { to: "/privacy", label: "Política de Privacidade" },
                  { to: "/shopping", label: "Shopping Pet" },
                ].map((lnk) => (
                  <Link
                    key={lnk.to}
                    to={lnk.to}
                    className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors py-1"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-600 px-4 py-2 rounded-full mb-3">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-medium">Perguntas Frequentes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">
              Dúvidas mais comuns
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
              Confira as respostas para as perguntas que mais recebemos. Se não
              encontrar o que procura, envie sua mensagem pelo formulário acima.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <FaqItem
                  item={faq}
                  isOpen={openFaqs.has(faq.id)}
                  onToggle={() => toggleFaq(faq.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Floating Back to Top ─── */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-200 flex items-center justify-center hover:bg-violet-700 transition-colors"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
