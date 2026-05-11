import { Link, NavLink, useNavigate, useLocation } from "react-router"; // Se der erro aqui, mude para "react-router"
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  PawPrint,
  ShoppingBag,
  Hotel,
  Footprints,
  Info,
  LogIn,
  LogOut,
  ChevronRight,
  UserCircle,
  ShoppingCart,
  Loader2,
  Calendar,
  ChevronDown,
  User,
  Search,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useCart } from "../cart/CartContext";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";
import logo from "../../assets/pet+/logo2.png";

const publicNavItems = [
  { name: "Hotéis", href: "/hotels", icon: Hotel },
  { name: "Pet Sitter", href: "/walkers", icon: Footprints },
  { name: "Shopping", href: "/shopping", icon: ShoppingBag },
  { name: "Sobre Nós", href: "/about", icon: Info },
];

const tutorMenuItems = [
  { name: "Meu Perfil", href: "/tutor/perfil", icon: UserCircle },
  { name: "Meus Pets", href: "/tutor/pets", icon: PawPrint },
  { name: "Meus Agendamentos", href: "/tutor/agendamentos", icon: Calendar },
  { name: "Meus Pedidos", href: "/tutor/pedidos", icon: ShoppingBag },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      console.log("⌚ Timeout ativado: Forçando fim do loading...");
      setIsLoading(false);
    }, 2000);

    const checkAuthStatus = () => {
      console.log("🔍 Iniciando verificação de sessão...");
      try {
        const token = localStorage.getItem("petplus_token");
        const userStr = localStorage.getItem("petplus_user");

        if (token && userStr) {
          const user = JSON.parse(userStr);
          console.log("✅ Usuário encontrado:", user.email);
          setSessionUser(user);
          setRoleId(user.role_id);
        } else {
          console.log("❌ Nenhum usuário logado no momento.");
          setSessionUser(null);
          setRoleId(null);
        }
      } catch (err) {
        console.error("🚨 Erro ao carregar sessão:", err);
      } finally {
        clearTimeout(fallbackTimer);
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Podemos também ouvir um evento de storage se o login ocorrer em outra aba
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMobile = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    import("../../lib/services/authService").then(({ authService }) => {
      authService.logout();
      // authService.logout already does window.location.href = "/login"
      // but if we wanted to change it for tutors, we could handle it here.
      // Since the service uses window.location, it's a hard redirect. 
    });
  };

  const userEmail = sessionUser?.email || "";
  const userName = sessionUser?.full_name || sessionUser?.name || userEmail.split('@')[0] || "Usuário";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isTutor = roleId === 5 || (sessionUser && roleId === null);
  const isDashboardUser = roleId !== null && roleId >= 1 && roleId <= 4;

  const { totalItems } = useCart();

  return (
    <>
      <nav 
        className={cn(
          "sticky top-0 z-50",
          isScrolled 
            ? "bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300" 
            : "bg-white border-b border-slate-100 transition-all duration-300"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* ── Logo + Desktop Nav ── */}
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center flex-1">
                <Link to="/" className="flex flex-shrink-0 items-center gap-2">
                  <ImageWithFallback src={logo} alt="Pet+ Logo" className="h-16 w-auto" />
                </Link>
                
                {/* ── Navbar Search (Desktop) ── */}
                <div className="hidden lg:flex flex-1 max-w-lg mx-12">
                  <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400 group-focus-within:text-[var(--color-primary-500)] transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar hotéis, walkers, produtos..."
                      className="block w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:ring-4 focus:ring-[var(--color-primary-50)] focus:border-[var(--color-primary-300)] transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-10">
                <div className="flex md:space-x-10">
                  {publicNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent transition-colors whitespace-nowrap",
                          isActive && "border-[var(--color-primary-500)] text-slate-900"
                        )}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Desktop Right Side ── */}
            <div className="hidden md:flex items-center gap-6 ml-10">
              {isLoading ? (
                // Texto simples de carregamento para termos certeza que ele sai daqui
                <span className="text-sm text-slate-400">Carregando perfil...</span>
              ) : !sessionUser ? (
                // Not Logged In
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-full shadow-sm">
                  <Link 
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-full transition-all"
                  >
                    <LogIn size={16} />
                    Entrar
                  </Link>
                  <Link 
                    to="/register"
                    className="bg-[var(--color-primary-500)] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[var(--color-primary-600)] shadow-md shadow-primary-500/20 transition-all transform hover:scale-105"
                  >
                    Cadastrar
                  </Link>
                </div>
              ) : isDashboardUser ? (
                // Admin, Manager, Hotel, Walker
                <>
                  <Link to="/dashboard">
                    <Button variant="default">Ir para o Dashboard</Button>
                  </Link>
                  <Button variant="ghost" className="text-slate-500 hover:text-red-600" onClick={() => setShowLogoutModal(true)}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : isTutor && (
                // Tutor
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setUserDropdownOpen(!userDropdownOpen);
                      }
                    }}
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                    className={cn(
                      "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-200 outline-none",
                      userDropdownOpen 
                        ? "bg-white border-[var(--color-primary-200)] shadow-md ring-4 ring-[var(--color-primary-50)]" 
                        : "bg-slate-50 border-slate-200 hover:border-[var(--color-primary-200)] hover:bg-white hover:shadow-sm"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary-400)] to-[var(--color-primary-600)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                      {userName.split(" ")[0]}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-slate-400 transition-transform duration-200",
                      userDropdownOpen && "rotate-180 text-[var(--color-primary-500)]"
                    )} />
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="font-bold text-slate-900 text-sm">{userName}</p>
                          <p className="text-xs text-slate-500">{userEmail}</p>
                        </div>

                        <div className="py-1">
                          {tutorMenuItems.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <item.icon className="h-4 w-4" />
                              {item.name}
                            </Link>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              setShowLogoutModal(true);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Sair da conta
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle... Omitido para economizar espaço aqui mas está funcional no código */}
            <div className="-mr-2 flex items-center md:hidden gap-2">
               <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-400">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu Overlay ── */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full z-50 bg-white border-b border-slate-100 shadow-xl overflow-y-auto" style={{ maxHeight: "calc(100vh - 4rem)" }}>
          <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
            {/* Mobile Search */}
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar no Pet+..."
                className="block w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
              />
            </div>
            
            {/* Navegação Pública (Itens do menu) */}
            <div className="flex flex-col gap-2 pt-4">
              {publicNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      isActive 
                        ? "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-4 pb-2">
              {isLoading ? (
                <div className="px-4 py-2 text-sm text-slate-400">Carregando perfil...</div>
              ) : !sessionUser ? (
                // Not Logged In Mobile
                <div className="flex flex-col gap-3 px-4">
                  <Link 
                    to="/login"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <LogIn size={18} />
                    Entrar
                  </Link>
                  <Link 
                    to="/register"
                    onClick={closeMobile}
                    className="flex items-center justify-center w-full py-3 text-sm font-bold text-white bg-[var(--color-primary-500)] rounded-xl hover:bg-[var(--color-primary-600)] shadow-md transition-colors"
                  >
                    Cadastrar
                  </Link>
                </div>
              ) : isDashboardUser ? (
                // Admin, Manager, Hotel, Walker Mobile
                <div className="flex flex-col gap-3 px-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center text-white text-base font-bold">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{userName}</p>
                      <p className="text-xs text-slate-500">{userEmail}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" onClick={closeMobile} className="w-full">
                    <Button variant="default" className="w-full justify-center">Ir para o Dashboard</Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700" 
                    onClick={() => {
                      closeMobile();
                      setShowLogoutModal(true);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair da conta
                  </Button>
                </div>
              ) : isTutor && (
                // Tutor Mobile
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 mb-2 px-4 pt-2">
                    <div className="h-10 w-10 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center text-white text-base font-bold shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{userName}</p>
                      <p className="text-xs text-slate-500">{userEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {tutorMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={closeMobile}
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-slate-400" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="mt-2 px-4">
                    <button
                      onClick={() => {
                        closeMobile();
                        setShowLogoutModal(true);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </nav>

      

      {/* ── Logout Modal ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            {isLoggingOut ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-500)] mb-4" />
                <p className="text-slate-600 font-medium text-center">Desconectando...</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Sair da conta?</h2>
                <p className="text-slate-500 mb-6 text-sm">Tem certeza que deseja desconectar da sua conta?</p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowLogoutModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
                    Sim, sair
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}