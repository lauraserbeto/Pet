import { useEffect } from "react";
import { useLocation } from "react-router";

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    // Com âncora (ex.: /terms#pagamentos), posiciona na seção em vez de saltar
    // para o topo. As rotas são lazy, então o alvo pode ainda não existir no
    // primeiro render — tentamos por um curto período antes de desistir.
    const id = hash.slice(1);
    const scrollToTarget = () => {
      const el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    };

    if (scrollToTarget()) return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (scrollToTarget() || attempts > 20) clearInterval(timer);
    }, 50);

    return () => clearInterval(timer);
  }, [pathname, hash]);

  return null;
}
