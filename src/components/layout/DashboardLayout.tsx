import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Package,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  Home,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar } from "../../components/ui/avatar";
import { Outlet, NavLink, Link, useLocation } from "react-router";
import { cn } from "../../lib/utils";
import { useEffect, useRef } from "react";
import { ThemeToggle } from "../../app/components/ThemeToggle";

export function DashboardLayout() {
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  const navLinks = [
    {
      name: "Visão Geral",
      href: "/dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: "Agenda",
      href: "/dashboard/schedule",
      icon: CalendarIcon,
      end: false,
    },
    {
      name: "Clientes",
      href: "/dashboard/customers",
      icon: Users,
      end: false,
    },
    {
      name: "Produtos",
      href: "/dashboard/products",
      icon: Package,
      end: false,
    },
    {
      name: "Configurações",
      href: "/dashboard/settings",
      icon: Settings,
      end: false,
    },
  ];

  return (
    <div className="flex h-screen bg-[var(--dash-content-bg)] font-[family-name:var(--font-body)] text-[var(--text-primary)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--dash-sidebar-bg)] text-[var(--dash-sidebar-text)] hidden md:flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-6">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <h1 className="text-2xl font-bold text-[var(--footer-heading)] font-[family-name:var(--font-display)]">
              Pet
              <span className="text-[var(--dash-sidebar-active)]">+</span>{" "}
              Partner
            </h1>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-[var(--dash-sidebar-active)] text-[var(--text-on-accent)] shadow-md"
                    : "hover:bg-white/5 hover:text-[var(--footer-heading)]"
                )
              }
            >
              <link.icon
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-medium">{link.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar
              className="h-10 w-10 border-2 border-[var(--dash-sidebar-active)]"
              fallback="LO"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-[var(--footer-heading)] truncate">
                PetShop Mundo Animal
              </p>
              <p className="text-xs text-[var(--dash-sidebar-text)] truncate">
                online
              </p>
            </div>
          </div>

          <Link to="/">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent text-[var(--dash-sidebar-text)] border-white/10 hover:bg-white/5 hover:text-[var(--footer-heading)] hover:border-white/20 mt-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair para o Site
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-[var(--dash-header-bg)] border-b border-[var(--border-default)] flex items-center justify-between px-4 sm:px-6 z-10 shadow-[var(--shadow-sm)] flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                className="pl-10"
                placeholder="Buscar no painel..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/" className="md:hidden">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </Button>
            <Button className="hidden sm:flex shadow-sm hover:shadow-md transition-shadow">
              Novo Agendamento
            </Button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-[var(--dash-content-bg)]"
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
