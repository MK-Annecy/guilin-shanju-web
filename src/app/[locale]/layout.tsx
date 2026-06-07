import type { Metadata } from 'next';
import { Noto_Serif_SC, Noto_Sans_SC, Cormorant_Garamond, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import '../globals.css';

const notoSerif = Noto_Serif_SC({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
});

const notoSans = Noto_Sans_SC({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();
  const brand = (messages as any).brand;
  return {
    title: {
      default: `${brand.name} | ${brand.nameLatin}`,
      template: `%s | ${brand.name}`,
    },
    description: brand.taglineEn,
    openGraph: {
      title: brand.name,
      description: brand.taglineEn,
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${notoSerif.variable} ${notoSans.variable} ${cormorant.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-cloud text-ink">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
