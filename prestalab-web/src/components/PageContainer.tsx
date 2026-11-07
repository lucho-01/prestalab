import React from 'react';

/** Contenedor de página con el espaciado de la app móvil (24px). */
export default function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`px-6 lg:px-10 py-8 max-w-[1240px] w-full mx-auto ${className}`}>
      {children}
    </main>
  );
}
