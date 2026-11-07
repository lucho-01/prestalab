'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, LogOut, Menu } from 'lucide-react';
import { useActiveRole } from '@/context/RoleContext';
import { useSidebar } from '@/context/SidebarContext';

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
};

/**
 * Barra superior — mismo lenguaje que la app móvil:
 * fondo blanco, borde inferior suave, título grande y acciones discretas.
 */
export default function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { activeUser, logout } = useActiveRole();
  const { toggle: toggleSidebar } = useSidebar();
  const [notificaciones, setNotificaciones] = useState<
    Array<{ id: string; titulo: string; mensaje: string; leida: boolean; fecha?: string }>
  >([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch('/api/notificaciones');
      const data = await res.json();
      if (data.success) setNotificaciones(data.data || []);
    } catch {
      // silencioso: el centro de alertas es secundario
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const unread = notificaciones.filter((n) => !n.leida).length;

  const markAllAsRead = async () => {
    await Promise.all(
      notificaciones
        .filter((n) => !n.leida)
        .map((n) =>
          fetch('/api/notificaciones', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id, leida: true }),
          }),
        ),
    );
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  return (
    <header
      className="sticky top-0 z-30 pl-3 pr-4 sm:pl-6 sm:pr-6 lg:pl-10 lg:pr-10 py-4 sm:py-5 flex items-center justify-between gap-3"
      style={{
        background: 'rgba(245, 251, 246, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Botón de menú: en móvil el sidebar se despliega hacia la derecha */}
        <button
          onClick={toggleSidebar}
          title="Abrir menú"
          aria-label="Abrir menú de navegación"
          className="lg:hidden w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="page-title truncate">{title}</h1>
          {subtitle ? <p className="page-subtitle truncate">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu((v) => !v)}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center relative transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Notificaciones"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span
                className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ background: 'var(--primary)' }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] card p-4 z-50"
              style={{ boxShadow: '0 18px 40px rgba(24, 28, 26, 0.12)' }}
            >
              <div className="flex items-center justify-between pb-3">
                <p className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                  Notificaciones
                </p>
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[12px] font-semibold flex items-center gap-1"
                    style={{ color: 'var(--primary)' }}
                  >
                    <Check size={13} /> Marcar leídas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto scroll-thin divide-y" style={{ borderColor: 'var(--border)' }}>
                {notificaciones.length === 0 ? (
                  <p className="py-6 text-center muted">Sin notificaciones.</p>
                ) : (
                  notificaciones.map((n) => (
                    <div key={n.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
                          {n.titulo}
                        </p>
                        {n.fecha ? (
                          <span className="text-[11px]" style={{ color: 'var(--text-soft)' }}>
                            {new Date(n.fecha).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[12px] leading-snug mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {n.mensaje}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2.5 pl-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold"
            style={{ background: 'var(--green-soft-strong)', color: 'var(--primary-dark)' }}
          >
            {(activeUser.nombre || 'PL').substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden lg:block leading-tight">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
              {activeUser.nombre}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-soft)' }}>
              {ROL_LABEL[activeUser.rol] || activeUser.rol}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ color: 'var(--text-soft)' }}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
