import { Link, NavLink, useNavigate } from "react-router";
import { Button } from "../ui/button";
import {
  Menu,
  X,
  PawPrint,
  ShoppingBag,
  Hotel,
  Footprints,
  Info,
  User,
  CalendarDays,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

/* ─── Public nav items (always visible) ─── */
const publicNavItems = [
  { name: "Hotéis", href: "/hotels", icon: Hotel },
  { name: "Passeadores", href: "/walkers", icon: Footprints },
  { name: "Shopping", href: "/shopping", icon: ShoppingBag },
  { name: "Sobre Nós", href: "/about", icon: Info },
];

/* ─── Logged-in user menu items ─── */
const userMenuItems = [
  { name: "Meu Perfil", href: "/profile", icon: UserCircle },
  { name: "Meus Agendamentos", href: "/appointments", icon: CalendarDays },
  { name: "Meus Favoritos", href: "/favorites", icon: Heart },
  { name: "Configurações", href: "/settings", icon: Settings },
];

/* ─── Mock user for demo (set to null to see logged-out state) ─── */
const MOCK_USER = {
  name: "Maria Souza",
  email: "maria@email.com",
  avatar: null as string | null,
};

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Simulate auth — toggle between logged-in / logged-out for demo
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const user = isLoggedIn ? MOCK_USER : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  const closeMobile = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* ── Logo + Desktop Nav ── */}
          <div className="flex items-center">
            <Link to="/" className="flex flex-shrink-0 items-center gap-2">
              <div className="bg-[var(--color-primary-500)] p-1.5 rounded-lg">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-display)]">
                Pet<span className="text-[var(--color-primary-500)]">+</span>
              </span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {publicNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent transition-colors",
                      isActive && "border-[var(--color-primary-500)] text-slate-900"
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* ── Desktop Right Side ── */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Para Parceiros
              </Button>
            </Link>

            {user ? (
              /* ── User Avatar Dropdown (Desktop) ── */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[var(--color-primary-200)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {initials}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-slate-400" />
                          {item.name}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Login / Register (Desktop) ── */
              <Link to="/login">
                <Button>Entrar</Button>
              </Link>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <div className="-mr-2 flex items-center md:hidden gap-2">
            {/* If logged in, show small avatar on mobile too */}
            {user && (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {initials}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary-500)]"
            >
              <span className="sr-only">Abrir menu</span>
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          {/* Logged-in user header */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Public nav */}
          <div className="space-y-1 py-2">
            {publicNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "block border-l-4 py-2.5 pl-3 pr-4 text-base font-medium transition-colors",
                    isActive
                      ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                  )
                }
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </span>
              </NavLink>
            ))}
          </div>

          {/* User-only menu items (when logged in) */}
          {user && (
            <div className="border-t border-slate-100 py-2">
              <p className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Minha Conta
              </p>
              {userMenuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center justify-between px-4 py-2.5 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  onClick={closeMobile}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    {item.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="border-t border-slate-100 py-2">
            <Link
              to="/dashboard"
              className="block border-l-4 border-transparent py-2.5 pl-3 pr-4 text-base font-medium text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              onClick={closeMobile}
            >
              Área do Parceiro
            </Link>

          </div>

          {/* Auth actions */}
          <div className="border-t border-slate-100 px-4 py-3 space-y-2">
            {user ? (
              <Button
                variant="outline"
                className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </Button>
            ) : (
              <>
                {/* Simular login for demo */}
                <Button className="w-full" onClick={() => { setIsLoggedIn(true); closeMobile(); }}>
                  Entrar
                </Button>
                <Link to="/register" onClick={closeMobile}>
                  <Button variant="outline" className="w-full">
                    Cadastre-se
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}