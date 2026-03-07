import { Bell, Search, Home, Loader2, User, Globe, LogOut } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar } from "../../components/ui/avatar";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Sidebar } from "./Sidebar";

export function DashboardLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Global Dashboard State
  const [roleId, setRoleId] = useState<number | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Header State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    const fetchUserRoleAndSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error("Sessão não encontrada");
        }

        setSessionUser(session.user);

        // Fetch using the exact query from instructions
        const { data, error: userError } = await supabase
          .from("users")
          .select("role_id, full_name")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        if (data) {
          setRoleId(data.role_id);
          
          let finalName = data.full_name || "Usuário";
          
          // Se for Parceiro (Lojista: 2, Hotel: 3, Pet Sitter: 4)
          if ([2, 3, 4].includes(data.role_id)) {
            const { data: providerData } = await supabase
              .from('providers')
              .select('business_name')
              .eq('user_id', session.user.id)
              .single();
            
            if (providerData && providerData.business_name) {
              finalName = providerData.business_name;
            }
          }
          
          setDisplayName(finalName);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoleAndSession();
  }, []);

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
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary-500)]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-[family-name:var(--font-body)]">
      {/* Sidebar with props received from global layout state */}
      <Sidebar roleId={roleId} userName={displayName} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-4 sm:px-6 z-10 shadow-sm flex-shrink-0 gap-4">
          <div className="flex items-center gap-4 flex-1">
             {/* Mobile Menu Trigger could go here */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-[var(--color-primary-500)]" placeholder="Buscar no painel..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="md:hidden">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Home className="h-5 w-5 text-slate-600" />
                </Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5 text-slate-600 hover:text-[var(--color-primary-600)] transition-colors" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            </Button>
            
            {/* Profile Dropdown Component */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden text-sm">
                    {/* Header: Nome e Função */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="font-semibold text-slate-800 truncate">{displayName || 'Usuário'}</p>
                      <p className="text-xs text-slate-500 truncate">{getRoleLabel(roleId)}</p>
                    </div>
                    
                    {/* Corpo do Dropdown */}
                    <div className="p-1">
                      <Link 
                        to="/dashboard/perfil" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Meu Perfil
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

        {/* Scrollable Content Area */}
        <main ref={scrollRef} className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
           <div className="max-w-7xl mx-auto">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}
