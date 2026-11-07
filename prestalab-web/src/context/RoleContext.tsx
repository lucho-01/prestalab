'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

export interface ActiveUserSimulation {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  laboratoriosAsignados?: string[];
  laboratoriosNombres?: string;
}

export const SIMULATED_USERS: Record<string, ActiveUserSimulation> = {
  admin: {
    id: 'user-admin-1',
    nombre: 'Ing. Mateo Gómez',
    email: 'admin.prestalab@universidad.edu.co',
    rol: 'admin',
    laboratoriosAsignados: ['sala-redes-201', 'sala-robotica-104', 'sala-computo-302', 'sala-multiuso-105', 'sala-quimica-205'],
    laboratoriosNombres: 'Todas las Salas (Acceso Total Global)',
  },
  gestorCarlos: {
    id: 'user-gestor-1',
    nombre: 'Ing. Carlos Mendoza',
    email: 'carlos.mendoza@universidad.edu.co',
    rol: 'gestor',
    laboratoriosAsignados: ['sala-redes-201', 'sala-robotica-104', 'sala-quimica-205'],
    laboratoriosNombres: 'Lab. Redes (201), Lab. Robótica (104), Lab. Sensores (205)',
  },
  gestorElena: {
    id: 'user-gestor-2',
    nombre: 'Dra. Elena Silva',
    email: 'elena.silva@universidad.edu.co',
    rol: 'gestor',
    laboratoriosAsignados: ['sala-computo-302', 'sala-multiuso-105'],
    laboratoriosNombres: 'Sala Cómputo IA (302), Lab. Multiuso (105)',
  },
  estudiante: {
    id: 'user-estudiante-1',
    nombre: 'Alejandro Morales',
    email: 'alejandro.morales@estudiantes.edu.co',
    rol: 'estudiante',
    laboratoriosAsignados: [],
    laboratoriosNombres: 'Consumidor de Servicios Académicos',
  },
};

interface RoleContextType {
  activeUser: ActiveUserSimulation;
  setActiveUserKey: (key: string) => void;
  activeUserKey: string;
  currentUser: ActiveUserSimulation | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  activeUser: SIMULATED_USERS.admin,
  setActiveUserKey: () => {},
  activeUserKey: 'admin',
  currentUser: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ActiveUserSimulation | null>(null);
  const [activeUserKey, setActiveUserKey] = useState<string>('admin');
  const [loading, setLoading] = useState<boolean>(true);

  // Consultar sesión al cargar
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser(data.user);
            // Sincronizar activeUser según el rol
            if (data.user.rol === 'admin') setActiveUserKey('admin');
            else if (data.user.id === 'user-gestor-2') setActiveUserKey('gestorElena');
            else if (data.user.rol === 'gestor') setActiveUserKey('gestorCarlos');
            else setActiveUserKey('estudiante');
          }
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

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
        if (data.user.rol === 'admin') setActiveUserKey('admin');
        else if (data.user.id === 'user-gestor-2') setActiveUserKey('gestorElena');
        else if (data.user.rol === 'gestor') setActiveUserKey('gestorCarlos');
        else setActiveUserKey('estudiante');

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
      setCurrentUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const activeUser = currentUser || SIMULATED_USERS[activeUserKey] || SIMULATED_USERS.admin;

  return (
    <RoleContext.Provider
      value={{
        activeUser,
        setActiveUserKey,
        activeUserKey,
        currentUser,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useActiveRole() {
  return useContext(RoleContext);
}
