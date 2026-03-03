import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "../../app/components/ScrollToTop";

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-body)]">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
