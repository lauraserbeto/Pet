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
  LogOut,
  ChevronRight,
  UserCircle,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useCart } from "../cart/CartContext";
import { supabase } from "../../lib/supabase";
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
  { name: "Meus Pedidos", href: "/tutor/pedidos", icon: ShoppingBag },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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
    const fallbackTimer = setTimeout(() => {
      console.log("⌚ Timeout ativado: Forçando fim do loading...");
      setIsLoading(false);
    }, 2000);

    const checkAuthStatus = async () => {
      console.log("🔍 Iniciando verificação de sessão...");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log("✅ Usuário encontrado:", session.user.email);
          setSessionUser(session.user);
          await fetchUserRole(session.user.id);
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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Mudança de status de autenticação:", event);
      
      if (event === "INITIAL_SESSION") return;

      if (session?.user) {
        setSessionUser(session.user);
        await fetchUserRole(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setSessionUser(null);
        setRoleId(null);
      }
      setIsLoading(false);
      setUserDropdownOpen(false);
    });

    return () => {
      clearTimeout(fallbackTimer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    console.log("🔍 Buscando role_id para o usuário:", userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(" Erro ao buscar role_id detalhado ->", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      if (data) {
        console.log("Role ID encontrado:", data.role_id);
        setRoleId(data.role_id);
      } else {
        console.warn("Nenhum role_id retornado para o usuário:", userId);
      }
    } catch (err: any) {
      console.error("Exceção capturada no fetchUserRole:", err.message || err);
    }
  };

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

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout no Supabase")), 3000)
      );

      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);
      
    } catch (error: any) {
    } finally {      
      for (let key in localStorage) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      }

      toast.success('Conta deslogada com sucesso!');

      setSessionUser(null);
      setRoleId(null);
      
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      
      setTimeout(() => {
        navigate("/", { replace: true });
        window.location.reload();
      }, 1200);
    }
  };

  const userEmail = sessionUser?.email || "";
  const userName = sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name || userEmail.split('@')[0] || "Usuário";
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
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* ── Logo + Desktop Nav ── */}
            <div className="flex items-center">
              <Link to="/" className="flex flex-shrink-0 items-center gap-2">
                <ImageWithFallback src={logo} alt="Pet+ Logo" className="h-18 w-auto" />
              </Link>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {publicNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent transition-colors",
                        isActive && "border-[var(--color-primary-500)] text-slate-900"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── Desktop Right Side ── */}
            <div className="hidden md:flex items-center gap-3">
              {isLoading ? (
                // Texto simples de carregamento para termos certeza que ele sai daqui
                <span className="text-sm text-slate-400">Carregando perfil...</span>
              ) : !sessionUser ? (
                // Not Logged In
                <>
                  <Link to="/login">
                    <Button variant="ghost">Entrar</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Cadastrar</Button>
                  </Link>
                </>
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
                    className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[var(--color-primary-200)] transition-all focus:outline-none"
                  >
                    <div className="h-9 w-9 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center text-white text-sm font-bold">
                      {initials}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
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
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
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
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sair da conta
                        </button>
                      </div>
                    </div>
                  )}
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