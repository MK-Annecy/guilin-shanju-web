import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Users, Bed, Maximize2, ArrowRight } from 'lucide-react';

const rooms = {
  suite: {
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2400',
  },
  double: {
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2400',
  },
  twin: {
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2400',
  },
} as const;

type RoomId = keyof typeof rooms;

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!(id in rooms)) notFound();

  const roomId = id as RoomId;
  const t = await getTranslations('rooms');
  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('nav');

  const room = rooms[roomId];

  return (
    <>
      {/* Hero image */}
      <section className="relative h-[60vh] min-h-[500px]">
        <Image
          src={room.imageUrl}
          alt={t(`details.${roomId}.name`)}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-6 md:px-10 py-16">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 text-sm text-ink-mute hover:text-moss mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('title')}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Main */}
          <div className="md:col-span-2">
            <p className="text-xs tracking-[0.3em] uppercase text-wood mb-3">
              {t('title')}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-ink leading-tight">
              {t(`details.${roomId}.name`)}
            </h1>
            <p className="mt-6 text-lg text-ink-soft leading-relaxed">
              {t(`details.${roomId}.longDesc`)}
            </p>

            {/* Specs */}
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
              <div>
                <Maximize2 className="w-5 h-5 text-moss mb-2" />
                <div className="text-xs text-ink-mute uppercase tracking-wider">Size</div>
                <div className="text-sm text-ink mt-1">{t(`details.${roomId}.size`)}</div>
              </div>
              <div>
                <Bed className="w-5 h-5 text-moss mb-2" />
                <div className="text-xs text-ink-mute uppercase tracking-wider">Bed</div>
                <div className="text-sm text-ink mt-1">{t(`details.${roomId}.bed`)}</div>
              </div>
              <div>
                <Users className="w-5 h-5 text-moss mb-2" />
                <div className="text-xs text-ink-mute uppercase tracking-wider">Capacity</div>
                <div className="text-sm text-ink mt-1">{t(`details.${roomId}.capacity`)}</div>
              </div>
            </div>
          </div>

          {/* Sidebar: book */}
          <aside className="md:col-span-1">
            <div className="bg-cloud-dark p-8 sticky top-28">
              <div className="text-xs text-ink-mute uppercase tracking-wider">
                {t('fromPrice')}
              </div>
              <div className="font-serif text-3xl text-moss mt-1">
                {t(`details.${roomId}.price`)}
                <span className="text-sm text-ink-mute ml-1 font-sans">{t('perNight')}</span>
              </div>
              <Link
                href={`/book/${roomId}` as any}
                className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-moss text-cloud hover:bg-moss-dark transition-colors"
              >
                {t('bookNow')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-4 text-xs text-ink-mute text-center">
                {tCommon('learnMore')} → /contact
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
