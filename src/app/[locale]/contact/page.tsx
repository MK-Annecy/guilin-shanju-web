import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapPin, Phone, MessageCircle, Mail, Clock } from 'lucide-react';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');

  const items = [
    { icon: MapPin, key: 'address' },
    { icon: Phone, key: 'phone' },
    { icon: MessageCircle, key: 'wechat' },
    { icon: Mail, key: 'email' },
    { icon: Clock, key: 'hours' },
  ];

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

      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-start gap-6 pb-8 border-b border-line last:border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cloud-dark flex items-center justify-center">
                  <Icon className="w-5 h-5 text-moss" />
                </div>
                <div className="flex-1">
                  <div className="text-xs tracking-[0.2em] uppercase text-ink-mute mb-1">
                    {t(`${item.key}` as any)}
                  </div>
                  <div className="text-base text-ink">
                    {t(`${item.key}Value` as any)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
