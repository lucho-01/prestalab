'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useActiveRole } from '@/context/RoleContext';

/**
 * Estructura del portal. Mientras se resuelve la sesión no se renderiza el
 * panel: evita mostrar datos de rol "por defecto" que no existen.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading } = useActiveRole();

  const isAuthPage = pathname === '/login';
  const isStaff = currentUser?.rol === 'admin' || currentUser?.rol === 'gestor';

  useEffect(() => {
    if (isAuthPage || loading) return;
    if (!currentUser || !isStaff) {
      router.replace('/login');
    }
  }, [isAuthPage, loading, currentUser, isStaff, router]);

  if (isAuthPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  if (loading || !isStaff) {
    return (
      <div
        className="w-full min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)', color: 'var(--text-soft)' }}
      >
        <span className="text-[14px]">Cargando sesión…</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto scroll-thin">
        {children}
      </div>
    </div>
  );
}
