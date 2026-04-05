import { ReactNode } from 'react';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';

import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';

import { Providers } from '@/app/providers';
import { getMessages, getTranslations } from 'next-intl/server';

export default async function RootLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  const t = await getTranslations('Metadata');

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <title>{t('title')}</title>
        <meta name="description" content={t('description')} />
        <link rel="icon" href="/Images/numerologyPNG.png" />
      </head>

      <body suppressHydrationWarning>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Providers>

        <Script
          id="gtag-src"
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${
            process.env?.NEXT_PUBLIC_GOOGLE_ANALYTICS ?? 'UA-137260564-1'
          }`}
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${
              process.env?.NEXT_PUBLIC_GOOGLE_ANALYTICS ?? 'UA-137260564-1'
            }', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
