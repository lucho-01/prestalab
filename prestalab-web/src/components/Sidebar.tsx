'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  DoorOpen,
  Boxes,
  Users,
  BarChart3,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useActiveRole } from '@/context/RoleContext';
import Brand from '@/components/Brand';

export default function Sidebar() {
  const pathname = usePathname();
  const { activeUser, setActiveUserKey, activeUserKey, logout, currentUser } =
    useActiveRole();

  const navItems = [
    { label: 'Inicio', href: '/', icon: LayoutDashboard, allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'] },
    { label: 'Préstamos', href: '/prestamos', icon: ArrowLeftRight, allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'] },
    { label: 'Salas', href: '/salas', icon: DoorOpen, allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'] },
    { label: 'Inventario', href: '/inventario', icon: Boxes, allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'] },
    { label: 'Usuarios', href: '/usuarios', icon: Users, allowedRoles: ['admin'] },
    { label: 'Analítica', href: '/analitica', icon: BarChart3, allowedRoles: ['admin', 'gestor'] },
  ];

  const handleLogout = async () => {
    if (confirm('¿Deseas cerrar tu sesión en PrestaLab?')) {
      await logout();
    }
  };

  return (
    <aside
      className="w-[264px] shrink-0 flex flex-col select-none"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Marca */}
      <div className="px-5 pt-6 pb-5">
        <Brand />
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 overflow-y-auto scroll-thin">
        <p
          className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-soft)' }}
        >
          Módulos
        </p>

        <div className="space-y-1">
          {navItems.map((item) => {
            const allowed = item.allowedRoles.includes(activeUser.rol);
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (!allowed) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] opacity-40 cursor-not-allowed"
                  style={{ color: 'var(--text-muted)' }}
                  title="Acceso restringido para este rol"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] font-medium transition-colors"
                style={
                  isActive
                    ? {
                        background: 'var(--green-soft-strong)',
                        color: 'var(--primary-dark)',
                        fontWeight: 600,
                      }
                    : { color: 'var(--text-muted)' }
                }
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--green-soft)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'var(--text-soft)' }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Selector de rol (entorno de pruebas) */}
        {!currentUser && (
          <div
            className="mt-6 rounded-[14px] p-3"
            style={{ background: 'var(--green-soft)', border: '1px solid var(--border)' }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5"
              style={{ color: 'var(--text-soft)' }}
            >
              Vista de rol (demo)
            </p>
            <div className="relative">
              <select
                value={activeUserKey}
                onChange={(e) => setActiveUserKey(e.target.value)}
                className="w-full appearance-none rounded-[10px] bg-white px-2.5 py-2 pr-7 text-[12px] font-medium outline-none"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="admin">Administrador</option>
                <option value="gestorCarlos">Gestor · Redes / Robótica</option>
                <option value="gestorElena">Gestora · Cómputo / Multiuso</option>
                <option value="estudiante">Estudiante</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-soft)' }}
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug" style={{ color: 'var(--text-soft)' }}>
              {activeUser.laboratoriosNombres || 'Permisos según rol'}
            </p>
          </div>
        )}
      </nav>

      {/* Usuario */}
      <div className="p-3.5" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{ background: 'var(--green-soft-strong)', color: 'var(--primary-dark)' }}
          >
            {(activeUser.nombre || 'PL').substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
              {activeUser.nombre}
            </p>
            <p className="text-[11px] capitalize" style={{ color: 'var(--text-soft)' }}>
              {activeUser.rol}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-soft)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--warning-bg)';
              e.currentTarget.style.color = 'var(--warning-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-soft)';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
