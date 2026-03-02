import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  ChevronDown,
  ChevronRight,
  ArrowUp,
  Shield,
  Database,
  Eye,
  Share2,
  Lock,
  Cookie,
  Baby,
  Globe,
  UserX,
  FileText,
  Mail,
  RefreshCcw,
  ServerCrash,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */

const lastUpdated = "20 de fevereiro de 2026";

const sections = [
  {
    id: "introducao",
    icon: Shield,
    title: "1. Introdução",
    content: `A Pet+ Inc. ("Pet+", "nós" ou "nossa") valoriza a privacidade e a proteção dos dados pessoais de seus Usuários. Esta Política de Privacidade ("Política") descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos suas informações pessoais quando você utiliza a plataforma Pet+.

Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis à proteção de dados no Brasil.

Ao utilizar a Plataforma, você consente com as práticas descritas nesta Política. Caso não concorde, recomendamos que não utilize nossos serviços.`,
  },
  {
    id: "coleta",
    icon: Database,
    title: "2. Dados que Coletamos",
    content: `Coletamos diferentes categorias de dados, dependendo da forma como você interage com a Plataforma:

**Dados fornecidos por você**:
• Nome completo, e-mail, telefone e CPF (cadastro);
• Endereço (para entregas e serviços presenciais);
• Informações do pet (nome, raça, porte, idade, vacinação);
• Dados de pagamento (processados por parceiro homologado — não armazenamos dados de cartão);
• Fotos de perfil e do pet;
• Avaliações e comentários publicados na Plataforma.

**Dados coletados automaticamente**:
• Endereço IP, tipo de dispositivo, sistema operacional e navegador;
• Páginas visitadas, tempo de permanência e interações na Plataforma;
• Dados de localização aproximada (com seu consentimento);
• Cookies e tecnologias similares (veja seção específica).

**Dados de terceiros**:
• Informações de redes sociais (caso opte pelo login social);
• Dados fornecidos por Parceiros durante a prestação de serviços.`,
  },
  {
    id: "finalidade",
    icon: Eye,
    title: "3. Como Utilizamos seus Dados",
    content: `Utilizamos seus dados pessoais para as seguintes finalidades:

• **Prestação de serviços**: criar e gerenciar sua conta, processar reservas de Hotelaria e Pet Sitter, processar compras no Shopping;
• **Comunicação**: enviar confirmações, atualizações de pedidos, alertas de segurança e comunicações administrativas;
• **Personalização**: recomendar serviços e produtos relevantes com base no seu perfil e histórico de uso;
• **Melhoria da Plataforma**: analisar padrões de uso para aprimorar funcionalidades, desempenho e experiência do Usuário;
• **Segurança**: prevenir fraudes, abusos e atividades ilícitas na Plataforma;
• **Marketing**: enviar ofertas, promoções e novidades (com seu consentimento, podendo ser revogado a qualquer momento);
• **Obrigações legais**: cumprir exigências legais, regulatórias ou judiciais.

Não utilizamos seus dados pessoais para finalidades incompatíveis com as descritas acima sem obter seu consentimento prévio.`,
  },
  {
    id: "compartilhamento",
    icon: Share2,
    title: "4. Compartilhamento de Dados",
    content: `Seus dados pessoais poderão ser compartilhados com:

• **Parceiros da Plataforma**: Hotelarias, Pet Sitters e vendedores do Shopping recebem as informações necessárias para a prestação do serviço ou entrega do produto (nome, contato, dados do pet e endereço, quando aplicável);
• **Processadores de pagamento**: instituições financeiras homologadas para processar transações de forma segura;
• **Prestadores de serviço**: empresas contratadas para hospedar dados, enviar e-mails, realizar análises e oferecer suporte ao cliente, sempre sob termos de confidencialidade;
• **Autoridades competentes**: quando exigido por lei, regulamento ou ordem judicial;
• **Em caso de reorganização societária**: fusão, aquisição ou venda de ativos, mediante garantia de continuidade da proteção dos dados.

**Não vendemos nem alugamos seus dados pessoais a terceiros para fins de marketing direto.**`,
  },
  {
    id: "seguranca",
    icon: Lock,
    title: "5. Segurança dos Dados",
    content: `Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acesso não autorizado, destruição, perda, alteração ou qualquer forma de tratamento inadequado:

• Criptografia de dados em trânsito (TLS/SSL) e em repouso;
• Controle de acesso baseado em papéis (RBAC) para equipe interna;
• Monitoramento contínuo de segurança e testes de vulnerabilidade;
• Backups regulares e plano de recuperação de desastres;
• Treinamento periódico da equipe sobre proteção de dados;
• Anonimização e pseudonimização de dados quando viável.

Apesar de nossos esforços, nenhum sistema de segurança é 100% infalível. Em caso de incidente de segurança que represente risco relevante, notificaremos os Usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD) conforme a legislação vigente.`,
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "6. Cookies e Tecnologias Similares",
    content: `Utilizamos cookies e tecnologias similares para melhorar sua experiência na Plataforma:

**Cookies essenciais**: necessários para o funcionamento básico da Plataforma (autenticação, carrinho de compras, preferências de sessão). Não podem ser desativados.

**Cookies de desempenho**: coletam informações sobre como os Usuários utilizam a Plataforma (páginas mais visitadas, erros). Dados são agregados e anonimizados.

**Cookies de funcionalidade**: permitem que a Plataforma lembre suas preferências (idioma, região, personalização de layout).

**Cookies de marketing**: utilizados para exibir anúncios relevantes com base no seu perfil de navegação. Podem ser desativados nas configurações do navegador.

Você pode gerenciar suas preferências de cookies a qualquer momento nas configurações da sua conta ou através das opções do seu navegador. A desativação de certos cookies pode afetar funcionalidades da Plataforma.`,
  },
  {
    id: "retencao",
    icon: ServerCrash,
    title: "7. Retenção de Dados",
    content: `Seus dados pessoais serão armazenados pelo tempo necessário para cumprir as finalidades descritas nesta Política, observando os seguintes critérios:

• **Dados de conta**: mantidos enquanto a conta estiver ativa, e por até 5 anos após o encerramento para cumprimento de obrigações legais;
• **Dados de transações**: mantidos por 5 anos para fins fiscais e contábeis;
• **Dados de navegação e cookies**: mantidos por até 12 meses;
• **Dados de marketing**: mantidos até a revogação do consentimento;
• **Logs de segurança**: mantidos por até 6 meses.

Após o término do período de retenção, os dados serão eliminados ou anonimizados de forma irreversível, salvo quando a lei exigir sua conservação.`,
  },
  {
    id: "direitos",
    icon: UserX,
    title: "8. Seus Direitos (LGPD)",
    content: `Nos termos da LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:

• **Confirmação e acesso**: saber se tratamos seus dados e obter cópia;
• **Correção**: solicitar a atualização de dados incompletos, inexatos ou desatualizados;
• **Anonimização, bloqueio ou eliminação**: de dados desnecessários, excessivos ou tratados em desconformidade;
• **Portabilidade**: solicitar a transferência dos seus dados a outro fornecedor;
• **Eliminação**: dos dados tratados com base no consentimento, quando aplicável;
• **Informação**: saber com quais entidades seus dados foram compartilhados;
• **Revogação do consentimento**: a qualquer momento, sem custos;
• **Oposição**: ao tratamento de dados quando houver descumprimento da LGPD.

Para exercer seus direitos, envie uma solicitação para **privacidade@petmais.com.br**. Responderemos em até 15 dias úteis.`,
  },
  {
    id: "menores",
    icon: Baby,
    title: "9. Dados de Menores de Idade",
    content: `A Plataforma Pet+ não é destinada a menores de 18 anos. Não coletamos intencionalmente dados pessoais de crianças ou adolescentes.

Caso identifiquemos que dados de menores foram coletados inadvertidamente, providenciaremos sua exclusão imediata.

Pais ou responsáveis legais que identifiquem que um menor sob sua responsabilidade forneceu dados à Plataforma devem entrar em contato conosco para solicitar a exclusão.`,
  },
  {
    id: "internacional",
    icon: Globe,
    title: "10. Transferência Internacional",
    content: `Seus dados poderão ser transferidos e processados em servidores localizados fora do Brasil, especialmente para serviços de infraestrutura em nuvem (cloud computing).

Quando houver transferência internacional, garantimos que:
• O país de destino possua nível adequado de proteção de dados, conforme determinação da ANPD; ou
• Sejam adotadas cláusulas contratuais padrão ou outras salvaguardas apropriadas conforme a LGPD.

Atualmente, nossos dados são processados em servidores localizados no Brasil e nos Estados Unidos, sempre com medidas de proteção equivalentes às exigidas pela legislação brasileira.`,
  },
  {
    id: "alteracoes",
    icon: RefreshCcw,
    title: "11. Alterações nesta Política",
    content: `Esta Política poderá ser atualizada periodicamente para refletir mudanças em nossas práticas, na legislação ou em orientações da ANPD.

Alterações significativas serão comunicadas:
• Por e-mail para o endereço cadastrado;
• Por notificação destacada na Plataforma;
• Com, no mínimo, 15 dias de antecedência à entrada em vigor.

A data da última atualização será sempre exibida no topo desta Política. Recomendamos a revisão periódica deste documento.`,
  },
  {
    id: "contato",
    icon: Mail,
    title: "12. Encarregado (DPO) e Contato",
    content: `A Pet+ designou um Encarregado pelo Tratamento de Dados Pessoais (DPO), nos termos do art. 41 da LGPD.

**Encarregado de Dados**:
• Nome: Departamento de Privacidade — Pet+ Inc.
• E-mail: privacidade@petmais.com.br
• Endereço: Av. Paulista, 1000, 10° andar — São Paulo/SP — CEP 01310-100

Você pode entrar em contato com nosso Encarregado para:
• Exercer seus direitos como titular de dados;
• Esclarecer dúvidas sobre o tratamento de seus dados;
• Reportar incidentes de segurança ou violação de dados;
• Solicitar informações sobre nossas práticas de privacidade.

Prazo de resposta: até 15 dias úteis a partir do recebimento da solicitação.`,
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
              ? "bg-[var(--color-secondary-500)] text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-[var(--color-secondary-50)] group-hover:text-[var(--color-secondary-600)]"
          }`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span
          className={`flex-1 text-sm sm:text-base font-bold transition-colors font-[family-name:var(--font-display)] ${
            isOpen ? "text-[var(--color-secondary-700)]" : "text-slate-800"
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
              isOpen ? "text-[var(--color-secondary-500)]" : "text-slate-400"
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

export function PrivacyPage() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["introducao"]));
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
      <section className="relative bg-gradient-to-br from-[var(--color-secondary-700)] via-[var(--color-secondary-600)] to-teal-400 overflow-hidden">
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
            <span className="text-white font-medium">Política de Privacidade</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Shield className="h-4 w-4 text-white" />
              <span className="text-xs sm:text-sm text-white font-medium">Proteção de Dados</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-[family-name:var(--font-display)] leading-tight">
              Política de Privacidade
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/80 max-w-2xl leading-relaxed">
              Saiba como a Pet+ coleta, utiliza e protege seus dados pessoais. Sua
              privacidade é nossa prioridade.
            </p>
            <p className="mt-2 text-xs text-white/50">
              Última atualização: {lastUpdated}
            </p>

            {/* LGPD badge */}
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl">
              <Lock className="h-4 w-4 text-white" />
              <span className="text-xs sm:text-sm text-white/90">
                Em conformidade com a <strong>LGPD</strong> (Lei nº 13.709/2018)
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm text-slate-500">
            {sections.length} seções &middot;{" "}
            <span className="font-medium text-slate-700">{openIds.size} abertas</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs sm:text-sm font-medium text-[var(--color-secondary-600)] hover:text-[var(--color-secondary-700)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--color-secondary-50)]"
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
            Para exercer seus direitos ou tirar dúvidas sobre o tratamento de seus dados,
            entre em contato com nosso Encarregado de Dados pelo e-mail{" "}
            <a
              href="mailto:privacidade@petmais.com.br"
              className="text-[var(--color-secondary-600)] font-medium hover:underline"
            >
              privacidade@petmais.com.br
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Link
              to="/terms"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-secondary-600)] hover:text-[var(--color-secondary-700)] transition-colors"
            >
              <FileText className="h-4 w-4" />
              Termos de Uso
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
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[var(--color-secondary-500)] text-white shadow-lg shadow-teal-200 flex items-center justify-center hover:bg-[var(--color-secondary-600)] transition-colors"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
