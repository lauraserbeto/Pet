import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Package, 
  Settings, 
  LogOut,
  ClipboardCheck,
  ShoppingCart,
  DollarSign,
  Globe
} from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import logo from "../../assets/pet+/logo2.png";


interface SidebarProps {
  roleId: number | null;
  userName: string;
}

export function Sidebar({ roleId, userName }: SidebarProps) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (roleId === null) {
    return null;
  }

  const menuItems = [
    { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard, roles: [1, 2, 3, 4], end: true },
    { name: 'Aprovações de Parceiros', href: '/dashboard/aprovacoes', icon: ClipboardCheck, roles: [1], end: false },
    { name: 'Meus Produtos', href: '/dashboard/products', icon: Package, roles: [2], end: false },
    { name: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart, roles: [2], end: false },
    { name: 'Agenda', href: '/dashboard/schedule', icon: CalendarIcon, roles: [3, 4], end: false },
    { name: 'Financeiro', href: '/dashboard/financeiro', icon: DollarSign, roles: [2, 3, 4], end: false },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings, roles: [1], end: false },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(roleId));

  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (id: number) => {
    switch (id) {
      case 1: return 'Admin Master';
      case 2: return 'PetShop';
      case 3: return 'Hotel';
      case 4: return 'Pet Sitter';
      default: return 'Usuário';
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="p-6">
         <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <ImageWithFallback src={logo} alt="Pet+ Logo" className="h-24 w-auto" />
         </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {allowedItems.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            end={link.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-[var(--color-primary-600)] text-white shadow-md"
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <link.icon size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
