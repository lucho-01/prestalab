import React from 'react';

const ESTADOS: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'pill-warn' },
  aprobado: { label: 'Aprobado', cls: 'pill-green' },
  activo: { label: 'Activo', cls: 'pill-green' },
  devuelto: { label: 'Devuelto', cls: 'pill-neutral' },
  rechazado: { label: 'Rechazado', cls: 'pill-danger' },
  vencido: { label: 'Vencido', cls: 'pill-danger' },
  disponible: { label: 'Disponible', cls: 'pill-green' },
  ocupado: { label: 'Ocupado', cls: 'pill-warn' },
  mantenimiento: { label: 'Mantenimiento', cls: 'pill-warn' },
  operativo: { label: 'Operativo', cls: 'pill-green' },
  en_reparacion: { label: 'En reparación', cls: 'pill-warn' },
  de_baja: { label: 'De baja', cls: 'pill-danger' },
  buen_estado: { label: 'Buen estado', cls: 'pill-green' },
  daniado: { label: 'Dañado', cls: 'pill-warn' },
  perdido: { label: 'Perdido', cls: 'pill-danger' },
};

/** Etiqueta de estado con los colores de la app móvil. */
export default function StatusPill({ estado }: { estado?: string | null }) {
  const key = String(estado || '').toLowerCase();
  const conf = ESTADOS[key] || {
    label: estado ? String(estado) : '—',
    cls: 'pill-neutral',
  };
  return <span className={`pill ${conf.cls}`}>{conf.label}</span>;
}
