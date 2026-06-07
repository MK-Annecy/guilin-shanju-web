import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <>
      <section className="pt-32 md:pt-40 pb-12 px-6 md:px-10 text-center max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl md:text-6xl font-light text-ink">
          {t('title')}
        </h1>
        <p className="mt-6 text-ink-soft">
          {t('subtitle')}
        </p>
      </section>

      {/* Story */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-wood mb-4">
              {t('story.eyebrow')}
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-ink leading-tight whitespace-pre-line">
              {t('story.title')}
            </h2>
            <p className="mt-6 text-ink-soft leading-relaxed whitespace-pre-line">
              {t('story.body')}
            </p>
          </div>
          <div className="relative aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=1200"
              alt="Mountain landscape"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 md:px-10 py-20 bg-cloud-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-light text-ink text-center mb-16">
            {t('values.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {t.raw('values.items') as Array<{ title: string; body: string }> ? (
              (t.raw('values.items') as Array<{ title: string; body: string }>).map(
                (v, idx) => (
                  <div key={idx}>
                    <div className="font-serif text-2xl text-moss mb-1">
                      0{idx + 1}
                    </div>
                    <h3 className="font-serif text-xl text-ink mb-3">
                      {v.title}
                    </h3>
                    <p className="text-sm text-ink-soft leading-relaxed">
                      {v.body}
                    </p>
                  </div>
                )
              )
            ) : (
              <>
                {['one', 'two', 'three'].map((_, idx) => (
                  <div key={idx}>
                    <h3 className="font-serif text-xl text-ink mb-3">
                      {t(`values.items.${idx}.title` as any)}
                    </h3>
                    <p className="text-sm text-ink-soft leading-relaxed">
                      {t(`values.items.${idx}.body` as any)}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
