import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  ChevronDown,
  ChevronRight,
  ArrowUp,
  FileText,
  Shield,
  Scale,
  Users,
  AlertTriangle,
  CreditCard,
  Ban,
  RefreshCcw,
  Gavel,
  Mail,
  PawPrint,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const lastUpdated = "20 de fevereiro de 2026";

const sections = [
  {
    id: "aceitacao",
    icon: FileText,
    title: "1. Aceitação dos Termos",
    content: `Ao acessar ou utilizar a plataforma Pet+ ("Plataforma"), incluindo o site, aplicativos móveis e quaisquer serviços relacionados, você ("Usuário") declara que leu, compreendeu e concorda integralmente com estes Termos de Uso ("Termos"). Caso não concorde com alguma disposição, solicitamos que não utilize a Plataforma.

A utilização continuada da Plataforma após eventuais atualizações destes Termos constitui aceitação das modificações. Recomendamos a consulta periódica deste documento.

Ao se cadastrar, o Usuário confirma ter pelo menos 18 (dezoito) anos de idade ou contar com autorização de seu representante legal para utilizar os serviços.`,
  },
  {
    id: "definicoes",
    icon: Users,
    title: "2. Definições",
    content: `Para os fins destes Termos, consideram-se:

• **Plataforma**: o conjunto de sistemas, sites e aplicativos operados pela Pet+ Inc.
• **Tutor**: pessoa física cadastrada que busca serviços ou produtos para seus animais de estimação.
• **Parceiro**: pessoa física ou jurídica que oferece serviços de Hotelaria, Pet Sitter ou produtos no Shopping da Plataforma.
• **Serviços**: funcionalidades disponibilizadas pela Plataforma, incluindo busca, reserva, contratação e compra de produtos e serviços pet.
• **Conteúdo do Usuário**: textos, fotos, avaliações e demais materiais publicados por Tutores ou Parceiros.
• **Shopping**: marketplace integrado à Plataforma para comercialização de produtos pet.`,
  },
  {
    id: "cadastro",
    icon: Shield,
    title: "3. Cadastro e Conta",
    content: `Para utilizar determinados recursos da Plataforma, o Usuário deverá criar uma conta fornecendo informações verídicas, completas e atualizadas. O Usuário é integralmente responsável por:

• Manter a confidencialidade de suas credenciais de acesso (e-mail e senha);
• Todas as atividades realizadas em sua conta;
• Notificar imediatamente a Pet+ em caso de uso não autorizado de sua conta;
• Manter seus dados cadastrais atualizados.

A Pet+ reserva-se o direito de suspender ou encerrar contas que contenham informações falsas, incompletas ou que violem estes Termos, sem aviso prévio e sem que isso gere direito a indenização.`,
  },
  {
    id: "servicos",
    icon: PawPrint,
    title: "4. Descrição dos Serviços",
    content: `A Pet+ atua como plataforma intermediadora, conectando Tutores a Parceiros que oferecem:

**Hotelaria Pet**: hospedagem temporária para animais de estimação em estabelecimentos cadastrados e avaliados pela comunidade.

**Pet Sitter**: serviço de cuidadores que acompanham e cuidam dos animais no domicílio do Tutor ou em outro local acordado.

**Shopping**: marketplace para aquisição de produtos pet (alimentação, higiene, acessórios, farmácia, conforto, roupas e beleza).

A Pet+ não é prestadora direta dos serviços de Hotelaria e Pet Sitter, tampouco fabricante ou vendedora dos produtos do Shopping. A relação contratual de prestação de serviço ou compra e venda se estabelece diretamente entre o Tutor e o Parceiro.`,
  },
  {
    id: "obrigacoes",
    icon: Scale,
    title: "5. Obrigações do Usuário",
    content: `Ao utilizar a Plataforma, o Usuário compromete-se a:

• Fornecer informações verdadeiras e precisas sobre si e sobre seus animais de estimação;
• Utilizar a Plataforma de forma ética, respeitando a legislação vigente e os direitos de terceiros;
• Não publicar conteúdo ofensivo, discriminatório, difamatório ou que viole direitos autorais;
• Não utilizar a Plataforma para fins ilícitos, fraudulentos ou que possam causar danos a terceiros;
• Manter atualizadas as informações de vacinação e saúde de seus pets ao contratar serviços;
• Respeitar os horários de check-in/check-out acordados com os Parceiros de Hotelaria;
• Realizar o pagamento pontual dos serviços e produtos contratados;
• Comunicar à Pet+ qualquer irregularidade verificada em serviços ou produtos.`,
  },
  {
    id: "pagamentos",
    icon: CreditCard,
    title: "6. Pagamentos e Política de Preços",
    content: `Os preços dos serviços e produtos são definidos pelos respectivos Parceiros e exibidos na Plataforma antes da confirmação pelo Tutor. A Pet+ poderá cobrar taxas de serviço, que serão informadas de forma transparente antes da finalização da transação.

**Métodos de pagamento**: cartão de crédito, cartão de débito, PIX e boleto bancário, conforme disponibilidade.

**Parcelamento**: disponível para compras no Shopping conforme condições exibidas no checkout.

**Faturamento**: os valores são processados por parceiros de pagamento homologados, garantindo segurança nas transações.

**Cancelamentos e reembolsos**: sujeitos à política específica de cada serviço/produto, detalhada na seção correspondente ou no momento da contratação.`,
  },
  {
    id: "cancelamento",
    icon: RefreshCcw,
    title: "7. Cancelamento e Reembolso",
    content: `**Serviços (Hotelaria e Pet Sitter)**:
• Cancelamento com mais de 48h de antecedência: reembolso integral;
• Cancelamento entre 24h e 48h: reembolso de 50% do valor;
• Cancelamento com menos de 24h: sem reembolso, salvo casos de força maior;
• O Parceiro que cancelar sem justificativa poderá sofrer penalidades na Plataforma.

**Shopping (Produtos)**:
• Direito de arrependimento: até 7 dias corridos após o recebimento, conforme o Código de Defesa do Consumidor;
• O produto deve estar lacrado e em sua embalagem original;
• O frete de devolução será por conta da Pet+ nos casos de arrependimento dentro do prazo legal;
• Produtos com defeito: troca ou reembolso integral em até 30 dias.`,
  },
  {
    id: "propriedade",
    icon: Gavel,
    title: "8. Propriedade Intelectual",
    content: `Todo o conteúdo da Plataforma — incluindo, mas não se limitando a, textos, imagens, logotipos, ícones, layouts, códigos, marcas e nomes comerciais — é de propriedade exclusiva da Pet+ Inc. ou de seus licenciadores, estando protegido pelas leis brasileiras e internacionais de propriedade intelectual.

É expressamente vedado ao Usuário:
• Reproduzir, distribuir ou modificar qualquer conteúdo da Plataforma sem autorização prévia e por escrito;
• Utilizar robôs, scrapers ou ferramentas automatizadas para extrair dados da Plataforma;
• Utilizar a marca "Pet+" ou quaisquer sinais distintivos da Plataforma sem autorização.

O Conteúdo do Usuário (avaliações, fotos, comentários) permanece de autoria do Usuário, porém ao publicá-lo na Plataforma, o Usuário concede à Pet+ licença gratuita, não exclusiva, mundial e por prazo indeterminado para uso, reprodução e exibição do conteúdo.`,
  },
  {
    id: "responsabilidade",
    icon: AlertTriangle,
    title: "9. Limitação de Responsabilidade",
    content: `A Pet+ empenha-se em manter a Plataforma disponível e funcionando corretamente, porém não garante:

• Disponibilidade ininterrupta ou isenta de erros da Plataforma;
• Que os resultados obtidos através da Plataforma atendam integralmente às expectativas do Usuário;
• A qualidade dos serviços prestados por Parceiros ou dos produtos vendidos no Shopping.

A Pet+ não será responsável por:
• Danos diretos, indiretos, incidentais ou consequentes resultantes do uso da Plataforma;
• Condutas de Parceiros ou de outros Usuários;
• Perda de dados decorrente de falhas técnicas, desde que adote medidas razoáveis de segurança;
• Eventos de força maior ou caso fortuito.

Em caso de litígio entre Tutor e Parceiro, a Pet+ poderá mediar a situação, mas não é obrigada a intervir ou a assumir responsabilidade.`,
  },
  {
    id: "encerramento",
    icon: Ban,
    title: "10. Suspensão e Encerramento",
    content: `A Pet+ poderá, a seu exclusivo critério e sem necessidade de aviso prévio, suspender ou encerrar a conta do Usuário que:

• Violar estes Termos de Uso ou a Política de Privacidade;
• Praticar condutas fraudulentas ou ilícitas;
• Causar danos à Plataforma, a outros Usuários ou a Parceiros;
• Permanecer inativo por período superior a 24 meses;
• Acumular avaliações negativas recorrentes sem demonstrar melhoria.

O Usuário pode solicitar o encerramento de sua conta a qualquer momento, entrando em contato pelo canal indicado na seção "Contato". O encerramento não isenta o Usuário de obrigações pendentes.`,
  },
  {
    id: "modificacoes",
    icon: RefreshCcw,
    title: "11. Modificações dos Termos",
    content: `A Pet+ reserva-se o direito de alterar estes Termos a qualquer momento, publicando a versão atualizada na Plataforma. Alterações relevantes serão comunicadas por e-mail ou notificação na Plataforma com, no mínimo, 15 (quinze) dias de antecedência.

A continuidade de uso da Plataforma após a vigência das alterações implica aceitação dos novos Termos. Caso o Usuário discorde, deverá cessar a utilização da Plataforma e solicitar o encerramento de sua conta.`,
  },
  {
    id: "contato",
    icon: Mail,
    title: "12. Foro e Contato",
    content: `Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo/SP como competente para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

**Canais de contato**:
• E-mail: termos@petmais.com.br
• Central de Ajuda: disponível na Plataforma (seção "Ajuda")
• Endereço: Av. Paulista, 1000, 10° andar — São Paulo/SP — CEP 01310-100

Horário de atendimento: segunda a sexta, das 8h às 20h (horário de Brasília).`,
  },
];

/* ═══════════════════════════════════════════════
   ACCORDION ITEM
   ═══════════════════════════════════════════════ */

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof sections)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = item.icon;
  return (
    <div className="border border-slate-100 rounded-xl sm:rounded-2xl bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 text-left group"
        aria-expanded={isOpen}
      >
        <div
          className={`shrink-0 p-2 sm:p-2.5 rounded-xl transition-colors ${
            isOpen
              ? "bg-[var(--color-primary-500)] text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-[var(--color-primary-50)] group-hover:text-[var(--color-primary-500)]"
          }`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span
          className={`flex-1 text-sm sm:text-base font-bold transition-colors font-[family-name:var(--font-display)] ${
            isOpen ? "text-[var(--color-primary-700)]" : "text-slate-800"
          }`}
        >
          {item.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronDown
            className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
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
            <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              <div className="border-t border-slate-100 pt-4 sm:pt-5">
                <div className="prose prose-sm sm:prose-base max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                  {item.content.split("**").map((part, i) =>
                    i % 2 === 1 ? (
                      <strong key={i} className="text-slate-800 font-semibold">
                        {part}
                      </strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */

export function TermsPage() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["aceitacao"]));
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenIds(new Set(sections.map((s) => s.id)));
  const collapseAll = () => setOpenIds(new Set());

  return (
    <div className="font-[family-name:var(--font-body)] bg-slate-50 min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative bg-gradient-to-br from-[var(--color-primary-600)] via-[var(--color-primary-500)] to-amber-400 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-white/60 mb-6">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-medium">Termos de Uso</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <FileText className="h-4 w-4 text-white" />
              <span className="text-xs sm:text-sm text-white font-medium">Documento Legal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-[family-name:var(--font-display)] leading-tight">
              Termos de Uso
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
              Leia com atenção os termos que regem o uso da plataforma Pet+. Clique em
              cada seção para expandir e consultar os detalhes.
            </p>
            <p className="mt-2 text-xs text-white/50">
              Última atualização: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm text-slate-500">
            {sections.length} cláusulas &middot;{" "}
            <span className="font-medium text-slate-700">{openIds.size} abertas</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs sm:text-sm font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--color-primary-50)]"
            >
              Expandir tudo
            </button>
            <button
              onClick={collapseAll}
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Recolher tudo
            </button>
          </div>
        </div>

        {/* Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {sections.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <AccordionItem
                item={item}
                isOpen={openIds.has(item.id)}
                onToggle={() => toggle(item.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 sm:mt-10 p-5 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center"
        >
          <p className="text-sm text-slate-500 leading-relaxed">
            Ao utilizar a plataforma Pet+, você declara estar ciente e de acordo com todos
            os termos acima. Caso tenha dúvidas, entre em contato pelo e-mail{" "}
            <a
              href="mailto:termos@petmais.com.br"
              className="text-[var(--color-primary-600)] font-medium hover:underline"
            >
              termos@petmais.com.br
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Link
              to="/privacy"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
            >
              <Shield className="h-4 w-4" />
              Política de Privacidade
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/shopping"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Voltar ao Shopping
            </Link>
          </div>
        </motion.div>
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
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[var(--color-primary-500)] text-white shadow-lg shadow-orange-200 flex items-center justify-center hover:bg-[var(--color-primary-600)] transition-colors"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
