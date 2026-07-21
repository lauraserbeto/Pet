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
      <Navbar />
      <main className="flex-grow">
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
