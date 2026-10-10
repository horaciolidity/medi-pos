import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinic POS - Sistema de Gestión Integral para Clínicas',
  description: 'Plataforma SaaS de gestión médica, administrativa y contable para clínicas pequeñas en Argentina.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
