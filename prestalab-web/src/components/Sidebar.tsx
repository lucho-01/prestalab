'use client';

import React, { useEffect } from 'react';
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
  X,
} from 'lucide-react';
import { useActiveRole } from '@/context/RoleContext';
import { useSidebar } from '@/context/SidebarContext';
import Brand from '@/components/Brand';

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor de laboratorio',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { activeUser, logout } = useActiveRole();
  const { open, close } = useSidebar();

  // Cierra el cajón al navegar o al pulsar Escape (solo aplica en móvil).
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const navItems = [
    { label: 'Inicio', href: '/', icon: LayoutDashboard, roles: ['admin', 'gestor'] },
    { label: 'Préstamos', href: '/prestamos', icon: ArrowLeftRight, roles: ['admin', 'gestor'] },
    { label: 'Salas', href: '/salas', icon: DoorOpen, roles: ['admin', 'gestor'] },
    { label: 'Inventario', href: '/inventario', icon: Boxes, roles: ['admin', 'gestor'] },
    { label: 'Usuarios', href: '/usuarios', icon: Users, roles: ['admin'] },
    { label: 'Analítica', href: '/analitica', icon: BarChart3, roles: ['admin', 'gestor'] },
  ];

  const visibles = navItems.filter((item) => item.roles.includes(activeUser.rol));

  const handleLogout = async () => {
    if (confirm('¿Deseas cerrar tu sesión en PrestaLab?')) {
      await logout();
    }
  };

  return (
    <>
      {/* Fondo oscurecido detrás del cajón (solo móvil) */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(24, 28, 26, 0.45)' }}
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[264px] max-w-[85vw] shrink-0 flex flex-col select-none transition-transform duration-200 ease-out lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:transition-none ${
          open ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'
        }`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
      {/* Marca */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between gap-2">
        <Brand />
        <button
          onClick={close}
          title="Cerrar menú"
          className="lg:hidden w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ color: 'var(--text-soft)' }}
        >
          <X size={16} />
        </button>
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
          {visibles.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

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
            <p className="text-[11px]" style={{ color: 'var(--text-soft)' }}>
              {ROL_LABEL[activeUser.rol] || activeUser.rol}
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
    </>
  );
}
