import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowUp, ChevronRight, ListTree } from "lucide-react";
import type { LegalDocument } from "../../content/legal/types";

/**
 * Página de documento legal (Termos, Privacidade, …).
 *
 * Antes cada página reimplementava hero + acordeão + voltar-ao-topo, com ~90%
 * de código duplicado. Aqui o layout é único e o que varia vem por props.
 *
 * Decisões de UX (padrão de mercado para documentos legais):
 * - Leitura LINEAR (nada colapsado): permite Ctrl+F, impressão e indexação.
 * - Sumário fixo com âncoras e scrollspy — deep-link por cláusula (/terms#pagamentos).
 * - Estrutura semântica real (h2 + p + ul/li) para leitores de tela.
 */

type ColorScheme = "primary" | "secondary";

type Props = {
  badge: string;
  title: string;
  subtitle: string;
  document: LegalDocument;
  colorScheme?: ColorScheme;
  crossLink: { to: string; label: string };
};

// Classes completas (o scanner do Tailwind não resolve strings montadas em runtime).
const SCHEMES: Record<ColorScheme, { hero: string; chipBg: string; chipText: string; accent: string; activeTab: string }> = {
  primary: {
    hero: "from-[var(--color-primary-600)] to-[var(--color-primary-500)]",
    chipBg: "bg-[var(--color-primary-50)]",
    chipText: "text-[var(--color-primary-700)]",
    accent: "text-[var(--color-primary-600)]",
    activeTab: "border-[var(--color-primary-500)] text-[var(--color-primary-700)] bg-[var(--color-primary-50)]",
  },
  secondary: {
    hero: "from-[var(--color-secondary-600)] to-[var(--color-secondary-500)]",
    chipBg: "bg-[var(--color-secondary-50)]",
    chipText: "text-[var(--color-secondary-700)]",
    accent: "text-[var(--color-secondary-600)]",
    activeTab: "border-[var(--color-secondary-500)] text-[var(--color-secondary-700)] bg-[var(--color-secondary-50)]",
  },
};

/** Converte **negrito** em <strong>, preservando o restante do texto. */
function renderInline(text: string): ReactNode[] {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-slate-900">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * Renderiza o texto do documento como HTML semântico: blocos separados por
 * linha em branco viram <p>, e linhas iniciadas por "•" viram <ul>/<li> reais
 * (antes eram apenas o caractere • dentro de um whitespace-pre-line).
 */
function renderContent(content: string): ReactNode {
  return content.split(/\n{2,}/).map((block, blockIndex) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const nodes: ReactNode[] = [];
    let bullets: string[] = [];

    const flushBullets = () => {
      if (bullets.length === 0) return;
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-3 list-disc space-y-1.5 pl-5">
          {bullets.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      bullets = [];
    };

    lines.forEach((line, i) => {
      if (line.startsWith("•")) {
        bullets.push(line.replace(/^•\s*/, ""));
      } else {
        flushBullets();
        nodes.push(
          <p key={`p-${i}`} className="my-3 leading-relaxed">
            {renderInline(line)}
          </p>
        );
      }
    });
    flushBullets();

    return <div key={blockIndex}>{nodes}</div>;
  });
}

export function LegalDocumentPage({
  badge,
  title,
  subtitle,
  document: doc,
  colorScheme = "primary",
  crossLink,
}: Props) {
  const scheme = SCHEMES[colorScheme];
  const [activeId, setActiveId] = useState(doc.sections[0]?.id ?? "");
  const [showTop, setShowTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const sectionIds = useMemo(() => doc.sections.map((s) => s.id), [doc.sections]);

  // Scrollspy: destaca no sumário a seção mais próxima do topo da viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-white font-[family-name:var(--font-body)]">
      {/* ─── Hero ─── */}
      <section className={`bg-gradient-to-br ${scheme.hero} text-white`}>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <nav aria-label="Trilha de navegação" className="mb-5 text-sm">
            <ol className="flex items-center gap-1.5 text-white/90">
              <li>
                <Link to="/" className="underline-offset-4 hover:underline">
                  Início
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </li>
              <li aria-current="page" className="font-medium text-white">
                {badge}
              </li>
            </ol>
          </nav>

          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            {badge}
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl font-[family-name:var(--font-display)]">{title}</h1>
          <p className="mt-2 max-w-2xl text-white/95">{subtitle}</p>

          {/* Contraste corrigido: antes era text-white/50 sobre gradiente (reprovava AA). */}
          <p className="mt-5 inline-block rounded-lg bg-black/25 px-3 py-1.5 text-sm text-white">
            Última atualização: <strong className="font-semibold">{doc.lastUpdated}</strong>
          </p>
        </div>
      </section>

      {/* ─── Corpo: sumário + documento ─── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-12">
          {/* Sumário */}
          <aside className="mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-20">
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:open:bg-transparent lg:border-0 lg:bg-transparent lg:p-0" open>
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-900 lg:cursor-default lg:list-none">
                  <ListTree className={`h-4 w-4 ${scheme.accent}`} />
                  Índice
                </summary>
                <nav aria-label="Índice do documento" className="mt-3">
                  <ul className="space-y-0.5 text-sm">
                    {doc.sections.map((section) => {
                      const isActive = activeId === section.id;
                      return (
                        <li key={section.id}>
                          <a
                            href={`#${section.id}`}
                            aria-current={isActive ? "location" : undefined}
                            className={`block rounded-md border-l-2 px-3 py-1.5 transition-colors ${
                              isActive
                                ? scheme.activeTab
                                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {section.title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </details>
            </div>
          </aside>

          {/* Documento */}
          <main className="min-w-0">
            <div className="space-y-10 text-slate-600">
              {doc.sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    ref={(el) => {
                      sectionRefs.current[section.id] = el;
                    }}
                    aria-labelledby={`${section.id}-title`}
                    className="scroll-mt-24 border-b border-slate-100 pb-8 last:border-0"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.35, delay: Math.min(index, 3) * 0.04 }}
                  >
                    <h2
                      id={`${section.id}-title`}
                      className="flex items-center gap-2.5 text-xl font-bold text-slate-900 sm:text-2xl font-[family-name:var(--font-display)]"
                    >
                      <span className={`rounded-lg p-2 ${scheme.chipBg} ${scheme.chipText}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      {section.title}
                    </h2>
                    <div className="mt-3 text-[15px]">{renderContent(section.content)}</div>
                  </motion.section>
                );
              })}
            </div>

            {/* Rodapé do documento */}
            <div className="mt-10 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">
                Ao continuar utilizando a Pet+, você concorda com este documento.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={crossLink.to}
                  className={`rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold ${scheme.accent} transition-colors hover:bg-slate-50`}
                >
                  {crossLink.label}
                </Link>
                <Link
                  to="/contact"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Falar com o suporte
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Voltar ao topo */}
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Voltar ao topo"
          className="fixed bottom-6 right-6 z-40 rounded-full bg-slate-900 p-3 text-white shadow-lg transition-transform hover:scale-105"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
