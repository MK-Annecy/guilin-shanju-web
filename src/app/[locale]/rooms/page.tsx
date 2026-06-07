import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RoomCard } from '@/components/room-card';

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('rooms');

  const rooms = [
    {
      id: 'suite' as const,
      imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200',
    },
    {
      id: 'double' as const,
      imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200',
    },
    {
      id: 'twin' as const,
      imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200',
    },
  ];

  return (
    <>
      <section className="pt-32 md:pt-40 pb-16 px-6 md:px-10 text-center">
        <h1 className="font-serif text-4xl md:text-6xl font-light text-ink">
          {t('title')}
        </h1>
        <p className="mt-6 text-ink-soft max-w-xl mx-auto">
          {t('subtitle')}
        </p>
      </section>

      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.map((r) => (
            <RoomCard
              key={r.id}
              id={r.id}
              imageUrl={r.imageUrl}
              name={t(`details.${r.id}.name`)}
              shortDesc={t(`details.${r.id}.shortDesc`)}
              price={t(`details.${r.id}.price`)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
