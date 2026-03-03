import { PawPrint } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-[var(--footer-bg)] text-[var(--footer-text)] py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[var(--accent-bg)] p-1.5 rounded-lg">
                <PawPrint className="h-5 w-5 text-[var(--text-on-accent)]" />
              </div>
              <span className="text-xl font-bold text-[var(--footer-heading)] font-[family-name:var(--font-display)]">
                Pet+
              </span>
            </div>
            <p className="text-sm">
              Conectando tutores aos melhores serviços e produtos para seus
              pets.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--footer-heading)] tracking-wider uppercase mb-4 font-[family-name:var(--font-display)]">
              Serviços
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="/hotels"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Hotelaria
                </a>
              </li>
              <li>
                <a
                  href="/walkers"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Pet Sitter
                </a>
              </li>
              <li>
                <a
                  href="/shopping"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Shopping
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--footer-heading)] tracking-wider uppercase mb-4 font-[family-name:var(--font-display)]">
              Empresa
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Para Parceiros
                </a>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--footer-heading)] tracking-wider uppercase mb-4 font-[family-name:var(--font-display)]">
              Legal
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/terms"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-[var(--footer-heading)] transition-colors"
                >
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--footer-border)] pt-8 text-center text-xs text-[var(--text-muted)]">
          &copy; 2024 Pet+ Inc. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
