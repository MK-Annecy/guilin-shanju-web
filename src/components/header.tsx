'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { Menu, X, Globe } from 'lucide-react';
import { useParams } from 'next/navigation';

export function Header() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const tCommon = useTranslations('common');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as string) || 'zh';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/', label: t('home') },
    { href: '/rooms', label: t('rooms') },
    { href: '/experiences', label: t('experiences') },
    { href: '/gallery', label: t('gallery') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

  const toggleLocale = () => {
    const next = currentLocale === 'zh' ? 'en' : 'zh';
    router.replace(pathname, { locale: next });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-cloud/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif text-xl md:text-2xl font-medium tracking-wide text-ink">
            {tBrand('name')}
          </span>
          <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-ink-mute mt-1">
            {tBrand('nameLatin')}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft hover:text-moss transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side: lang + book */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-moss transition-colors"
            aria-label={tCommon('language')}
          >
            <Globe className="w-4 h-4" />
            {currentLocale === 'zh' ? 'EN' : '中'}
          </button>
          <Link
            href="/rooms"
            className="px-5 py-2.5 bg-moss text-cloud text-sm tracking-wide hover:bg-moss-dark transition-colors"
          >
            {t('book')}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-ink"
          aria-label="menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div className="lg:hidden bg-cloud border-t border-line">
          <nav className="px-6 py-6 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-ink-soft hover:text-moss py-2"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-line flex items-center justify-between">
              <button
                onClick={toggleLocale}
                className="flex items-center gap-1.5 text-sm text-ink-soft"
              >
                <Globe className="w-4 h-4" />
                {currentLocale === 'zh' ? 'EN' : '中'}
              </button>
              <Link
                href="/rooms"
                onClick={() => setOpen(false)}
                className="px-5 py-2.5 bg-moss text-cloud text-sm"
              >
                {t('book')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
