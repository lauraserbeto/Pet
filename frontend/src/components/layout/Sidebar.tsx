import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Package, 
  Settings, 
  LogOut,
  ClipboardCheck,
  ShoppingCart,
  DollarSign,
  Globe,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Store
} from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";

import { cn } from "../../lib/utils";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logo from "../../assets/pet+/logo2.png";


interface SidebarProps {
  roleId: number | null;
  userName: string;
  onLinkClick?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function Sidebar({ 
  roleId, 
  userName, 
  onLinkClick, 
  className,
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
  isLoggingOut = false
}: SidebarProps) {
  const navigate = useNavigate();

  if (roleId === null) {
    return null;
  }

  const menuItems = [
    { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard, roles: [1, 2, 3, 4], end: true },
    { name: 'Aprovações de Parceiros', href: '/dashboard/aprovacoes', icon: ClipboardCheck, roles: [1], end: false },
    { name: 'Avaliações de Pet Sitters', href: '/dashboard/avaliacoes-sitters', icon: Heart, roles: [1], end: false },
    { name: 'Meu Perfil Público', href: '/dashboard/perfil', icon: Store, roles: [2, 3, 4], end: false },
    { name: 'Meus Produtos', href: '/dashboard/products', icon: Package, roles: [2], end: false },
    { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart, roles: [2], end: false },
    { name: 'Agenda', href: '/dashboard/schedule', icon: CalendarIcon, roles: [3, 4], end: false },
    { name: 'Financeiro', href: '/dashboard/financeiro', icon: DollarSign, roles: [2, 3, 4], end: false },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings, roles: [1], end: false },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(roleId));

  return (
    <aside className={cn(
        "bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64",
        className
    )}>
      {/* Collapse Toggle Button (Desktop Only) */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex absolute -right-3 top-20 bg-slate-800 text-white p-1 rounded-full border border-slate-700 hover:bg-[var(--color-primary-600)] transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={cn("p-6", isCollapsed && "px-4")}>
         <Link to="/" onClick={onLinkClick} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <ImageWithFallback src={logo} alt="Pet+ Logo" className={cn("h-24 w-auto transition-all", isCollapsed && "h-12")} />
         </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {allowedItems.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            end={link.end}
            onClick={onLinkClick}
            title={isCollapsed ? link.name : ""}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-[var(--color-primary-600)] text-white shadow-md"
                  : "hover:bg-slate-800 hover:text-white",
                isCollapsed && "justify-center px-0"
              )
            }
          >
            <link.icon size={20} className="group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="font-medium truncate">{link.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Support & Site Area */}
      <div className={cn("p-4 border-t border-slate-800", isCollapsed && "px-2")}>
        <Link
          to="/"
          onClick={onLinkClick}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200 group font-medium mb-1",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Globe size={20} className="group-hover:rotate-12 transition-transform text-[var(--color-primary-500)]" />
          {!isCollapsed && <span>Ir para o Site</span>}
        </Link>

        <button
          onClick={onLogout}

          disabled={isLoggingOut}
          title={isCollapsed ? "Sair da conta" : ""}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-all duration-200 group font-medium",
            isCollapsed && "justify-center px-0"
          )}
        >
          {isLoggingOut ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          )}
          {!isCollapsed && <span>{isLoggingOut ? "Saindo..." : "Sair da conta"}</span>}
        </button>
      </div>
    </aside>
  );
}
