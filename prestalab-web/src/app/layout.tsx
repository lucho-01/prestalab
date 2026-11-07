import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { RoleProvider } from '@/context/RoleContext';
import AppShell from '@/components/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PrestaLab | Plataforma administrativa',
  description:
    'Gestión de préstamos de laboratorio, inventario y analítica institucional.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`h-full ${inter.variable}`}>
      <body className="h-full">
        <RoleProvider>
          <AppShell>{children}</AppShell>
        </RoleProvider>
      </body>
    </html>
  );
}
