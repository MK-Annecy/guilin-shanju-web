import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Hero } from '@/components/hero';
import { RoomCard } from '@/components/room-card';
import { ExperienceCard } from '@/components/experience-card';
import { ArrowRight } from 'lucide-react';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tRooms = await getTranslations('rooms');
  const tExp = await getTranslations('experiences');

  const roomIds = ['suite', 'double', 'twin'] as const;

  return (
    <>
      {/* HERO */}
      <Hero
        eyebrow={t('heroEyebrow')}
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        ctaPrimary={{ href: '/rooms', label: t('heroCta') }}
        ctaSecondary={{ href: '/experiences', label: t('heroCtaSecondary') }}
        imageUrl="https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2400"
        imageAlt="Mountain forest at dawn, Pu'er, Yunnan"
      />

      {/* INTRO */}
      <section className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-wood mb-4">
            {t('introEyebrow')}
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-light text-ink leading-tight mb-8 whitespace-pre-line">
            {t('introTitle')}
          </h2>
          <p className="text-base md:text-lg text-ink-soft leading-relaxed">
            {t('introBody')}
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-5xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-line pt-12">
          {[
            { k: 'altitude', v: 'altitudeValue' },
            { k: 'rooms', v: 'roomsValue' },
            { k: 'acreage', v: 'acreageValue' },
            { k: 'yearOpened', v: 'yearOpenedValue' },
          ].map((s) => (
            <div key={s.k} className="text-center">
              <div className="font-serif text-3xl md:text-4xl text-moss">
                {t(`stats.${s.v}` as any)}
              </div>
              <div className="text-xs tracking-[0.2em] uppercase text-ink-mute mt-2">
                {t(`stats.${s.k}` as any)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROOMS PREVIEW */}
      <section className="py-20 px-6 md:px-10 bg-cloud-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-wood mb-4">
              {t('roomsEyebrow')}
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-light text-ink leading-tight whitespace-pre-line">
              {t('roomsTitle')}
            </h2>
            <p className="mt-6 text-ink-soft max-w-xl mx-auto">
              {t('roomsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roomIds.map((id) => (
              <RoomCard
                key={id}
                id={id}
                imageUrl={
                  id === 'suite'
                    ? 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200'
                    : id === 'double'
                    ? 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200'
                    : 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200'
                }
                name={tRooms(`details.${id}.name`)}
                shortDesc={tRooms(`details.${id}.shortDesc`)}
                price={tRooms(`details.${id}.price`)}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 text-sm tracking-wide text-moss hover:text-moss-dark border-b border-moss pb-1"
            >
              {t('viewAllRooms')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* EXPERIENCES PREVIEW */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-wood mb-4">
              {t('experiencesEyebrow')}
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-light text-ink leading-tight whitespace-pre-line">
              {t('experiencesTitle')}
            </h2>
            <p className="mt-6 text-ink-soft max-w-xl mx-auto">
              {t('experiencesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ExperienceCard
              title={tExp('meditation.title')}
              desc={tExp('meditation.desc')}
              imageUrl="https://images.unsplash.com/photo-1593164842264-854604db2260?q=80&w=1200"
            />
            <ExperienceCard
              title={tExp('tea.title')}
              desc={tExp('tea.desc')}
              imageUrl="https://images.unsplash.com/photo-1564890369478-c89ca6c9b176?q=80&w=1200"
            />
            <ExperienceCard
              title={tExp('forest.title')}
              desc={tExp('forest.desc')}
              imageUrl="https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200"
            />
          </div>

          <div className="text-center mt-12">
            <Link
              href="/experiences"
              className="inline-flex items-center gap-2 text-sm tracking-wide text-moss hover:text-moss-dark border-b border-moss pb-1"
            >
              {t('viewAllExperiences')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-24 md:py-32 px-6 md:px-10 bg-moss text-cloud">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-cloud/60 mb-6">
            {t('testimonialEyebrow')}
          </p>
          <blockquote className="font-serif text-3xl md:text-5xl font-light leading-tight whitespace-pre-line">
            {t('testimonialTitle')}
          </blockquote>
          <p className="mt-8 text-sm text-cloud/70">— A guest from Shanghai, 2025</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 px-6 md:px-10 bg-cloud-dark">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-light text-ink leading-tight">
            {t('ctaTitle')}
          </h2>
          <p className="mt-6 text-ink-soft">
            {t('ctaSubtitle')}
          </p>
          <Link
            href="/rooms"
            className="inline-block mt-10 px-8 py-4 bg-moss text-cloud hover:bg-moss-dark transition-colors tracking-wide"
          >
            {t('heroCta')}
          </Link>
        </div>
      </section>
    </>
  );
}
