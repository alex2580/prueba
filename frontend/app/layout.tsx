import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '📦 TodasMisCosas.com — Marketplace de Almacenamiento Urbano',
  description:
    'Encontrá o publicá espacios de almacenamiento en Buenos Aires: cocheras, bauleras, depósitos y galpones. Alquiler diario o mensual.',
  keywords: 'almacenamiento, depósito, cochera, baulera, Buenos Aires, alquiler',
  openGraph: {
    title: 'TodasMisCosas.com',
    description: 'Marketplace de almacenamiento urbano en Buenos Aires',
    url: 'https://todasmiscosas.com',
    siteName: 'TodasMisCosas.com',
    locale: 'es_AR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
