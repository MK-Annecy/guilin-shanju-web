'use client';

import { useState, useTransition, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Check, AlertCircle, Shield } from 'lucide-react';
import { submitBookingWithFallback, type BookResult } from '@/app/actions/book';
import { ROOMS, type RoomId, isRoomId, computeNights } from '@/lib/booking';
import { Turnstile, type TurnstileHandle } from '@/components/turnstile';

const roomImages: Record<RoomId, string> = {
  suite: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200',
  double: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200',
  twin: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200',
};

export default function BookPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('book');
  const tRooms = useTranslations('rooms');
  const [, startTransition] = useTransition();

  const idParam = params.id as string;
  const roomId: RoomId = isRoomId(idParam) ? idParam : 'double';
  const room = ROOMS[roomId];

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
  const [result, setResult] = useState<BookResult | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const turnstileTokenRef = useRef<string>('');

  // Site key comes from a server-injected global (set in [locale]/layout.tsx),
  // or the wrangler.jsonc var at build time. Falls back to empty (widget hidden).
  const turnstileSiteKey = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return (
      (window as any).__TURNSTILE_SITE_KEY__ ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      ''
    );
  }, []);

  const nights = Math.max(1, computeNights(form.checkIn, form.checkOut) || 1);
  const total = room.pricePerNight * nights * form.guests;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    startTransition(async () => {
      const r = await submitBookingWithFallback({
        roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: form.guests,
        name: form.name,
        phone: form.phone,
        email: form.email,
        remarks: form.remarks,
        locale: locale === 'zh' ? 'zh' : 'en',
        turnstileToken: turnstileTokenRef.current,
      });
      setResult(r);
      setSubmitting(false);
      // Reset Turnstile after a failed submit so the user can retry
      if (!r.ok) {
        turnstileRef.current?.reset();
      }
    });
  };

  if (result?.ok) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-moss/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-moss" />
          </div>
          <h1 className="font-serif text-3xl text-ink mb-4">
            {t('successTitle')}
          </h1>
          <p className="text-ink-soft leading-relaxed">{t('success')}</p>
          <div className="mt-6 inline-block bg-cloud-dark border border-line px-6 py-3">
            <div className="text-xs tracking-[0.2em] uppercase text-ink-mute mb-1">
              {t('bookingRef')}
            </div>
            <div className="font-mono text-lg text-ink select-all">
              {result.bookingRef}
            </div>
          </div>
          <p className="text-xs text-ink-mute mt-4">{t('saveRef')}</p>
          <Link
            href="/"
            className="inline-block mt-8 text-sm text-moss hover:text-moss-dark border-b border-moss pb-0.5"
          >
            ← {t('backHome')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28 md:pt-36 pb-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/rooms/${roomId}` as any}
          className="inline-flex items-center gap-2 text-sm text-ink-mute hover:text-moss mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {tRooms(`details.${roomId}.name`)}
        </Link>

        <h1 className="font-serif text-4xl md:text-5xl font-light text-ink mb-12">
          {t('title')}
        </h1>

        {result && !result.ok && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-900">
                {t('errorTitle')}
              </div>
              <div className="text-sm text-red-700 mt-1">{result.error}</div>
            </div>
          </div>
        )}

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
                  min={today}
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
                  min={form.checkIn || today}
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
                maxLength={60}
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

            {/* Turnstile bot check */}
            {turnstileSiteKey ? (
              <div className="pt-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onTokenChange={(tok) => (turnstileTokenRef.current = tok)}
                />
                <p className="text-xs text-ink-mute mt-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  {t('botCheckNote')}
                </p>
              </div>
            ) : null}

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
                style={{ backgroundImage: `url(${roomImages[roomId]})` }}
              />
              <div className="font-serif text-xl text-ink">
                {tRooms(`details.${roomId}.name`)}
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
                    ¥{room.pricePerNight.toLocaleString()} {t('perNight')}
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
