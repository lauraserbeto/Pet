import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { LoadingState } from './LoadingState';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    async function getUserSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          navigate('/login');
          return;
        }

        const role = session.user.user_metadata?.role_id;
        setRoleId(role || null);
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');

      } catch (err) {
        console.error('Unexpected error loading user session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    getUserSession();
  }, [navigate]);

  // Guard Clause: Block rendering until loading finishes
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-16 h-16 rounded-xl bg-[var(--color-primary-500)] flex items-center justify-center text-white font-bold text-3xl mb-6 animate-pulse shadow-lg shadow-primary-500/20">
          P
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-slate-500 font-medium">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Fixed on desktop */}
      <Sidebar roleId={roleId} userName={userName} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 transition-all duration-300">
        <Navbar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
        
        {/* Simple Footer for Dashboard */}
        <footer className="py-4 px-8 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
            &copy; 2026 Pet+ - Sistema de Gestão Pet
          </p>
        </footer>
      </div>
    </div>
  );
}
