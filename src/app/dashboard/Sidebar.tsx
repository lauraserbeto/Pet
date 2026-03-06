import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Wallet, 
  Package, 
  ShoppingCart, 
  Calendar, 
  DoorOpen, 
  Bed, 
  MapPin, 
  UserPlus, 
  CheckCircle,
  LogOut,
  LucideIcon
} from 'lucide-react';
import { Link, useLocation } from 'react-router'; // or 'next/link' if it was fully Next.js, but keeping router patterns
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: number[];
}

const menuItems: MenuItem[] = [
  { title: "Visão Geral", href: "/dashboard", icon: LayoutDashboard, allowedRoles: [1, 2, 3, 4] },
  { title: "Configurações", href: "/dashboard/settings", icon: Settings, allowedRoles: [1, 2, 3, 4] },
  
  { title: "Clientes", href: "/dashboard/customers", icon: Users, allowedRoles: [2, 3, 4] },
  { title: "Financeiro", href: "/dashboard/finance", icon: Wallet, allowedRoles: [2, 3, 4] },

  { title: "Gestão de Usuários", href: "/dashboard/admin/users", icon: UserPlus, allowedRoles: [1] },
  { title: "Aprovação de Parceiros", href: "/dashboard/admin/approvals", icon: CheckCircle, allowedRoles: [1] },

  { title: "Produtos", href: "/dashboard/products", icon: Package, allowedRoles: [2] },
  { title: "Pedidos Físicos", href: "/dashboard/orders", icon: ShoppingCart, allowedRoles: [2] },
  { title: "Agenda", href: "/dashboard/schedule", icon: Calendar, allowedRoles: [3, 4] },
  { title: "Gestão de Vagas", href: "/dashboard/hotel/slots", icon: DoorOpen, allowedRoles: [3] },
  { title: "Reservas de Hospedagem", href: "/dashboard/hotel/bookings", icon: Bed, allowedRoles: [3] },
  { title: "Raio de Atendimento", href: "/dashboard/sitter/radius", icon: MapPin, allowedRoles: [4] },
];

interface SidebarProps {
  roleId: number | null;
  userName?: string;
}

export function Sidebar({ roleId, userName }: SidebarProps) {
  const { pathname } = useLocation();

  if (roleId === null) return null;

  const filteredMenu = menuItems.filter(item => item.allowedRoles.includes(roleId));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col z-40 border-r border-slate-800">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 group transition-all">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-500)] flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform">
            P
          </div>
          <h1 className="text-xl font-bold text-white font-[family-name:var(--font-display)]">
            Pet<span className="text-[var(--color-primary-500)]">+</span> Partner
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {filteredMenu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-[var(--color-primary-600)] text-white shadow-lg shadow-primary-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon 
                size={20} 
                className={cn(
                  "transition-all duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-[var(--color-primary-400)]"
                )} 
              />
              <span className="font-medium text-sm">{item.title}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-xl bg-slate-800/50">
          <div className="h-10 w-10 rounded-full bg-[var(--color-primary-500)] border-2 border-white/20 flex items-center justify-center text-white font-bold">
            {userName?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{userName || 'Usuário'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              {roleId === 1 && 'Admin Master'}
              {roleId === 2 && 'Lojista'}
              {roleId === 3 && 'Hotel'}
              {roleId === 4 && 'Pet Sitter'}
            </p>
          </div>
        </div>
        
        <Link to="/logout" className="block w-full">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-red-500/10 transition-all group"
          >
            <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            <span className="text-sm">Sair do Dashboard</span>
          </Button>
        </Link>
      </div>
    </aside>
  );
}
