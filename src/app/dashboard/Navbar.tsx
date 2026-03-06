import React from 'react';
import { Bell, Search, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-slate-600 hover:bg-slate-100"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-[var(--color-primary-500)] focus:bg-white transition-all rounded-full" 
            placeholder="Buscar informações no dashboard..." 
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-[var(--color-primary-600)] hover:bg-slate-50 rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </Button>
        
        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-bold text-slate-900 leading-none mb-1">Central de Ajuda</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Documentação</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full border-slate-200 hover:border-[var(--color-primary-300)] hover:bg-slate-50">
            <User className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>
    </header>
  );
}
