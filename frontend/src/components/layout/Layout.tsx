import { Suspense } from "react";
import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "../../app/components/ScrollToTop";
import { CustomLoader } from "../ui/loader";

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-body)]">
      <ScrollToTop />
      {/* Skip link (WCAG 2.4.1): visível ao receber foco por teclado. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-[var(--color-primary-600)] focus:shadow-lg focus:outline focus:outline-2 focus:outline-[var(--color-primary-500)]"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-grow">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <CustomLoader />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
