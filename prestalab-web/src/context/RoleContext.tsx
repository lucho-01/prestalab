'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

/** Usuario autenticado en el portal web (solo staff). */
export interface StaffUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  laboratoriosAsignados?: string[];
  departamento?: string;
}

/**
 * Valor neutro mientras se resuelve la sesión. AppShell no renderiza el panel
 * hasta que `currentUser` existe, así que nunca se muestra como dato real.
 */
const EMPTY_USER: StaffUser = {
  id: '',
  nombre: '',
  email: '',
  rol: 'gestor',
  laboratoriosAsignados: [],
  departamento: '',
};

interface RoleContextType {
  activeUser: StaffUser;
  currentUser: StaffUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  activeUser: EMPTY_USER,
  currentUser: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refresh: async () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
      router.push('/login');
    }
  };

  const activeUser = currentUser ?? EMPTY_USER;

  return (
    <RoleContext.Provider
      value={{ activeUser, currentUser, loading, login, logout, refresh }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useActiveRole() {
  return useContext(RoleContext);
}
