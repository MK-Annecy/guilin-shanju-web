'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: { href: string; label: string };
  ctaSecondary: { href: string; label: string };
  imageUrl: string;
  imageAlt: string;
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  imageUrl,
  imageAlt,
}: HeroProps) {
  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-cloud">
        <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-cloud/80 mb-6 animate-fade-in">
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light leading-[1.15] max-w-4xl whitespace-pre-line animate-fade-in-up">
          {title}
        </h1>
        <p className="mt-8 text-base md:text-lg text-cloud/90 max-w-xl font-light animate-fade-in-up">
          {subtitle}
        </p>
        <div className="mt-12 flex flex-col sm:flex-row gap-4 animate-fade-in-up">
          <Link
            href={ctaPrimary.href as any}
            className="px-8 py-3.5 bg-cloud text-ink hover:bg-cloud/90 transition-colors tracking-wide"
          >
            {ctaPrimary.label}
          </Link>
          <Link
            href={ctaSecondary.href as any}
            className="px-8 py-3.5 border border-cloud/60 text-cloud hover:bg-cloud/10 transition-colors tracking-wide"
          >
            {ctaSecondary.label}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cloud/60 animate-fade-in">
        <div className="w-px h-12 bg-cloud/40 mx-auto mb-2" />
        <span className="text-xs tracking-[0.3em] uppercase">Scroll</span>
      </div>
    </section>
  );
}
