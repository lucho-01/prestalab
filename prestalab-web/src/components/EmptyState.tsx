import React from 'react';
import { PackageOpen } from 'lucide-react';

/** Estado vacío — mismo patrón que la app móvil (EmptyState). */
export default function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center text-center px-6 py-12">
      <PackageOpen size={40} style={{ color: 'var(--text-soft)' }} strokeWidth={1.5} />
      <p className="mt-3 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      {hint ? (
        <p className="muted mt-1 max-w-[420px] leading-relaxed">{hint}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
