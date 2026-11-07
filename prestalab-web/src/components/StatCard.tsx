import React from 'react';

/** Tarjeta de métricas — equivalente web de StatsCard (app móvil). */
export default function StatCard({
  label,
  value,
  hint,
  tone = 'green',
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'green' | 'warn' | 'neutral';
  icon?: React.ReactNode;
}) {
  const toneBg =
    tone === 'warn'
      ? 'var(--warning-bg)'
      : tone === 'neutral'
        ? '#eef2ef'
        : 'var(--green-soft)';
  const toneColor =
    tone === 'warn'
      ? 'var(--warning-text)'
      : tone === 'neutral'
        ? 'var(--text-muted)'
        : 'var(--primary)';

  return (
    <div className="card card-pad flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-soft)]">
          {label}
        </span>
        {icon ? (
          <span
            className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{ background: toneBg, color: toneColor }}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div
        className="text-[30px] font-bold leading-none tracking-tight"
        style={{ color: 'var(--text)' }}
      >
        {value}
      </div>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  );
}
