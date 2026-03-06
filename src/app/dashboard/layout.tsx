import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { LoadingState } from './LoadingState';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface UserProfile {
  id: string;
  role_id: number;
  full_name: string | null;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    async function getUserData() {
      try {
        setLoading(true);
        
        // 1. Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // If no session, redirect to login could be handled here 
          // but usually the ProtectedRoute handles this.
          // For now just stop loading.
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // 2. Fetch role_id and name from public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role_id, full_name')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user role:', userError);
        } else if (userData) {
          setRoleId(userData.role_id);
          setUserName(userData.full_name || session.user.email?.split('@')[0] || '');
        }

      } catch (err) {
        console.error('Unexpected error loading user data:', err);
      } finally {
        // Adding a slight delay to ensure the loading state feels "elegant"
        // and doesn't just flash if the request is too fast.
        setTimeout(() => setLoading(false), 800);
      }
    }

    getUserData();
  }, []);

  if (loading) {
    return <LoadingState />;
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
            &copy; 2026 Pet+ Partner - Sistema de Gestão Pet
          </p>
        </footer>
      </div>
    </div>
  );
}
