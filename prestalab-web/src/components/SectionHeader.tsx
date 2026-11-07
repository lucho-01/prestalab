import React from 'react';

/** Encabezado de sección con contador, como en las pantallas móviles. */
export default function SectionHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="section-title">{title}</h2>
      <div className="flex items-center gap-3">
        {meta ? (
          <span className="text-[13px]" style={{ color: 'var(--text-soft)' }}>
            {meta}
          </span>
        ) : null}
        {action}
      </div>
    </div>
  );
}
