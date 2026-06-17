import type { Metadata } from 'next';
import { Noto_Serif_SC, Noto_Sans_SC, Cormorant_Garamond, Inter } from 'next/font/google';
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

export const metadata: Metadata = {
  title: {
    default: 'Admin · 归林山居',
    template: `%s · 归林山居 Admin`,
  },
  description: '归林山居内部管理后台',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh"
      className={`${notoSerif.variable} ${notoSans.variable} ${cormorant.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-cloud text-ink antialiased">{children}</body>
    </html>
  );
}