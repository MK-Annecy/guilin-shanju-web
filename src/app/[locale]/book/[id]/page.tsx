'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Check } from 'lucide-react';

const roomData = {
  suite: { image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200' },
  double: { image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200' },
  twin: { image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200' },
};

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('book');
  const tRooms = useTranslations('rooms');

  const id = params.id as keyof typeof roomData;
  const room = roomData[id] || roomData.double;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    checkIn: today,
    checkOut: tomorrow,
    guests: 2,
    name: '',
    phone: '',
    email: '',
    remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const nights =
    Math.max(
      1,
      Math.ceil(
        (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) /
          86400000
      )
    ) || 1;

  // Simple price calc
  const pricePerNight = id === 'suite' ? 1280 : id === 'double' ? 880 : 780;
  const total = nights * pricePerNight * form.guests;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: integrate with Supabase / API
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-moss/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-moss" />
          </div>
          <h1 className="font-serif text-3xl text-ink mb-4">
            {locale === 'zh' ? '收到！' : 'Thank you!'}
          </h1>
          <p className="text-ink-soft leading-relaxed">{t('success')}</p>
          <Link
            href="/"
            className="inline-block mt-8 text-sm text-moss hover:text-moss-dark border-b border-moss pb-0.5"
          >
            ← {locale === 'zh' ? '返回首页' : 'Back home'}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28 md:pt-36 pb-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/rooms/${id}` as any}
          className="inline-flex items-center gap-2 text-sm text-ink-mute hover:text-moss mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {tRooms(`details.${id}.name`)}
        </Link>

        <h1 className="font-serif text-4xl md:text-5xl font-light text-ink mb-12">
          {t('title')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Form */}
          <form onSubmit={submit} className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2">
                  {t('checkIn')}
                </label>
                <input
                  type="date"
                  required
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2">
                  {t('checkOut')}
                </label>
                <input
                  type="date"
                  required
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2">
                  {t('guests')}
                </label>
                <select
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: +e.target.value })}
                  className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {t('guest')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2">
                {t('name')}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('namePlaceholder')}
                className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder={t('phonePlaceholder')}
                  className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2">
                {t('remarks')}
              </label>
              <textarea
                rows={4}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder={t('remarksPlaceholder')}
                className="w-full px-4 py-3 bg-cloud-dark border border-line focus:border-moss focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-moss text-cloud hover:bg-moss-dark transition-colors disabled:opacity-50 tracking-wide"
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          </form>

          {/* Summary */}
          <aside className="md:col-span-1">
            <div className="bg-cloud-dark p-6 sticky top-28">
              <div className="text-xs tracking-[0.2em] uppercase text-ink-mute mb-4">
                {t('summary')}
              </div>
              <div
                className="aspect-[4/3] bg-cover bg-center mb-4"
                style={{ backgroundImage: `url(${room.image})` }}
              />
              <div className="font-serif text-xl text-ink">
                {tRooms(`details.${id}.name`)}
              </div>
              <div className="mt-4 space-y-2 text-sm text-ink-soft">
                <div className="flex justify-between">
                  <span>{t('checkIn')}</span>
                  <span className="text-ink">{form.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('checkOut')}</span>
                  <span className="text-ink">{form.checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span>{nights} {t('nights')}</span>
                  <span className="text-ink">
                    ¥{pricePerNight.toLocaleString()} {t('perNight')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{form.guests} {t('guest')}</span>
                  <span className="text-ink">×{form.guests}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-line flex justify-between font-serif text-lg">
                  <span>{t('total')}</span>
                  <span className="text-moss">¥{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
