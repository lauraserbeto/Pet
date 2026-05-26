/**
 * HamsterLoader
 * Componente de loading temático Pet+ com hamster na roda.
 * Não depende de styled-components — usa classes CSS definidas em index.css.
 */

interface HamsterLoaderProps {
  /** Mensagem exibida abaixo do loader. Padrão: "Carregando..." */
  message?: string;
  /** Tamanho do wrapper. "sm" = tela parcial, "full" = tela cheia */
  size?: "sm" | "full";
}

export function HamsterLoader({
  message = "Carregando...",
  size = "full",
}: HamsterLoaderProps) {
  const wrapperClass =
    size === "full"
      ? "flex flex-col items-center justify-center min-h-[60vh] gap-8"
      : "flex flex-col items-center justify-center py-16 gap-6";

  return (
    <div className={wrapperClass} role="status" aria-label={message}>
      {/* ── Hamster Wheel ── */}
      <div
        aria-label="Hamster correndo em uma roda"
        role="img"
        className="wheel-and-hamster"
      >
        <div className="wheel" />
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear" />
              <div className="hamster__eye" />
              <div className="hamster__nose" />
            </div>
            <div className="hamster__limb hamster__limb--fr" />
            <div className="hamster__limb hamster__limb--fl" />
            <div className="hamster__limb hamster__limb--br" />
            <div className="hamster__limb hamster__limb--bl" />
            <div className="hamster__tail" />
          </div>
        </div>
        <div className="spoke" />
      </div>

      {/* ── Label ── */}
      <div className="text-center">
        <p className="text-slate-600 font-semibold text-base tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
