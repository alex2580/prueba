import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/ui/Footer';
import '../globals.css';

const locales = ['es', 'pt'] as const;

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
    keywords: locale === 'es'
      ? 'almacenamiento, depósito, cochera, baulera, Buenos Aires, alquiler'
      : 'armazenamento, depósito, garagem, aluguel, urbano',
    openGraph: {
      title: 'TodasMisCosas.com',
      description: t('description'),
      url: 'https://todasmiscosas.com',
      siteName: 'TodasMisCosas.com',
      locale: locale === 'es' ? 'es_AR' : 'pt_BR',
      type: 'website',
    },
  };
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  if (!locales.includes(locale as 'es' | 'pt')) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
