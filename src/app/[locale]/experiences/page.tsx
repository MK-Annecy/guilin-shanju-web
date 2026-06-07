import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';

const experiences = [
  { key: 'meditation', image: 'https://images.unsplash.com/photo-1593164842264-854604db2260?q=80&w=1600' },
  { key: 'tea', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6c9b176?q=80&w=1600' },
  { key: 'forest', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600' },
  { key: 'stargazing', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1600' },
  { key: 'mushroom', image: 'https://images.unsplash.com/photo-1571597429281-0d33a7e0c1c7?q=80&w=1600' },
  { key: 'workshop', image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1600' },
] as const;

export default async function ExperiencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('experiences');

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
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {experiences.map((e, idx) => (
            <div
              key={e.key}
              className={`relative overflow-hidden ${
                idx === 0 ? 'md:col-span-2 aspect-[2/1]' : 'aspect-[4/3]'
              }`}
            >
              <Image
                src={e.image}
                alt={t(`${e.key}.title` as any)}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-cloud">
                <h3 className="font-serif text-2xl md:text-3xl">{t(`${e.key}.title` as any)}</h3>
                <p className="mt-2 text-sm md:text-base text-cloud/85 max-w-xl">
                  {t(`${e.key}.desc` as any)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
