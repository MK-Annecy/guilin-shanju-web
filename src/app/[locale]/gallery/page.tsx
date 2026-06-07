import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';

const galleryImages = [
  'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=1200',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200',
  'https://images.unsplash.com/photo-1593164842264-854604db2260?q=80&w=1200',
  'https://images.unsplash.com/photo-1564890369478-c89ca6c9b176?q=80&w=1200',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200',
  'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=1200',
  'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1200',
  'https://images.unsplash.com/photo-1571597429281-0d33a7e0c1c7?q=80&w=1200',
  'https://images.unsplash.com/photo-1572297870735-1c2f64f57c8b?q=80&w=1200',
  'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1200',
];

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gallery');

  return (
    <>
      <section className="pt-32 md:pt-40 pb-12 px-6 md:px-10 text-center">
        <h1 className="font-serif text-4xl md:text-6xl font-light text-ink">
          {t('title')}
        </h1>
        <p className="mt-6 text-ink-soft max-w-xl mx-auto">
          {t('subtitle')}
        </p>
      </section>

      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {galleryImages.map((src, idx) => (
            <div
              key={src}
              className={`relative overflow-hidden ${
                idx % 7 === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
              }`}
            >
              <Image
                src={src}
                alt={`Gallery ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
