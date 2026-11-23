import { Home, User, Globe, LogOut, Menu, X, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";
import { HamsterLoader } from "../ui/HamsterLoader";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Suspense, useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { authService } from "../../lib/services/authService";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { useCompleteness } from "../../lib/hooks/useCompleteness";
import { requiredFieldLabel } from "../../lib/profileCompleteness";

export function DashboardLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Global Dashboard State
  const [roleId, setRoleId] = useState<number | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Completude do perfil: fica no React Query para poder ser revalidada após
  // salvar o perfil (ver invalidateQueries em PublicProfile). Só parceiros
  // (3 = Hotel, 4 = Pet Sitter) têm perfil público a completar.
  const isProvider = roleId === 3 || roleId === 4;
  const { data: completeness } = useCompleteness(isProvider);

  // Header State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    const fetchUserRoleAndSession = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("petplus_user");
        
        if (!userStr) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(userStr);
        setSessionUser(user);
        setRoleId(user.role_id);
          
        let finalName = user.full_name || "Usuário";
        
        if (user.business_name) {
          finalName = user.business_name;
        }
        
        setDisplayName(finalName);
        // A completude do perfil é buscada pelo hook useCompleteness (React Query),
        // para poder ser revalidada após salvar o perfil.
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoleAndSession();
  }, [navigate]);

  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (id: number | null) => {
    switch (id) {
      case 1: return 'Admin Master';
      case 2: return 'PetShop';
      case 3: return 'Hotel';
      case 4: return 'Pet Sitter';
      default: return 'Usuário';
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      authService.logout();
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        {/* Mesmo carregamento com identidade do restante do app (G23). */}
        <HamsterLoader size="sm" message="Carregando seu painel..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-[family-name:var(--font-body)] overflow-hidden">
      {/* Menu do celular em Dialog (Radix): foco preso, Esc fecha, foco volta ao botão (E-34) */}
      <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="left-0 top-0 h-full max-w-64 w-64 translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-slate-900 p-0 sm:rounded-none md:hidden"
        >
          <DialogTitle className="sr-only">Menu do painel</DialogTitle>
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="p-2 text-slate-300 hover:text-white transition-colors"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            <Sidebar
              roleId={roleId}
              userName={displayName}
              onLinkClick={() => setIsMobileMenuOpen(false)}
              onLogout={handleLogout}
              isLoggingOut={isLoggingOut}
              className="w-full flex-1"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop Sidebar with props received from global layout state */}
      <Sidebar 
        roleId={roleId} 
        userName={displayName} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        className="hidden md:flex" 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 relative z-40 shadow-sm flex-shrink-0 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden rounded-lg text-slate-600 hover:bg-slate-100"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Abrir menu"
                aria-expanded={isMobileMenuOpen}
            >
                <Menu className="h-6 w-6" />
            </Button>
            {/* Busca do painel e sino de notificações removidos: não havia busca
                nem backend de notificações; o ponto vermelho era fixo (G19). */}
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="rounded-full md:hidden">
              <Link to="/" aria-label="Ir para o site">
                <Home className="h-5 w-5 text-slate-600" aria-hidden="true" />
              </Link>
            </Button>
            {/* Profile Dropdown Component */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label={`Menu da conta de ${displayName}`}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 rounded-full transition-shadow"
              >
                <Avatar className="h-9 w-9 border-2 border-[var(--color-primary-500)] bg-slate-100 flex items-center justify-center text-slate-700 font-bold hover:shadow-md transition-shadow" fallback={getInitials(displayName)}>
                  {getInitials(displayName)}
                </Avatar>
              </button>
 
              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-[100] overflow-hidden text-sm">
                    {/* Header: Nome e Função */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="font-semibold text-slate-800 truncate">{displayName || 'Usuário'}</p>
                      <p className="text-xs text-slate-500 truncate">{getRoleLabel(roleId)}</p>
                    </div>
                    
                    {/* Corpo do Dropdown */}
                    <div className="p-1">
                      <Link 
                        to="/dashboard/conta" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Minha Conta
                      </Link>
                      
                      <Link 
                        to="/" 
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Ir para o Site
                      </Link>
                      
                      <div className="h-px bg-slate-100 my-1"></div>
                      
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Completeness Alert Banner */}
        {completeness && !completeness.isComplete && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600 mt-0.5">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900 text-sm sm:text-base">
                    Seu perfil ainda não está visível para os tutores.
                  </p>
                  <p className="text-amber-800 text-xs sm:text-sm mt-0.5">
                    Para aparecer na vitrine, falta:
                    <span className="font-medium ml-1">
                      {completeness.missingFields.map(requiredFieldLabel).join(", ")}
                    </span>
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 transition-all flex-shrink-0 gap-2">
                <Link to="/dashboard/perfil">
                  Completar Perfil
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <main ref={scrollRef} className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
           <div className="max-w-7xl mx-auto">
             <Suspense
               fallback={
                 <div className="flex items-center justify-center py-16">
                   <HamsterLoader size="sm" message="Carregando..." />
                 </div>
               }
             >
               <Outlet />
             </Suspense>
           </div>
        </main>
      </div>
    </div>
  );
}
