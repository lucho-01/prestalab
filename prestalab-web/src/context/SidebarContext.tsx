'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

type SidebarState = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  close: () => void;
};

const SidebarCtx = createContext<SidebarState>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  close: () => {},
});

/**
 * Estado del cajón de navegación. En móvil el sidebar es un panel que se
 * desliza desde la izquierda hacia la derecha; en escritorio queda fijo.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <SidebarCtx.Provider value={{ open, setOpen, toggle, close }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarCtx);
}
