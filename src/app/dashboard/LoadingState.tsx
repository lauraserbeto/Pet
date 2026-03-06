import React from 'react';

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[var(--color-primary-500)] animate-spin"></div>
        {/* Inner Circle (Pulsing) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-[var(--color-primary-500)] rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="mt-4 text-slate-600 font-medium animate-pulse">Carregando painel...</p>
    </div>
  );
}
