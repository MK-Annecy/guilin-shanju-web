import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const tContact = useTranslations('contact');

  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-cloud/80 mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="font-serif text-2xl font-medium text-cloud">
              {tBrand('name')}
            </div>
            <div className="text-xs tracking-[0.2em] uppercase text-cloud/50 mt-1">
              {tBrand('nameLatin')}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-cloud/70 max-w-md">
              {tBrand('tagline')}
            </p>
            <p className="mt-2 text-xs text-cloud/50">
              {tContact('addressValue')}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-cloud/50 mb-4">
              {t('explore')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rooms" className="hover:text-cloud">{tNav('rooms')}</Link></li>
              <li><Link href="/experiences" className="hover:text-cloud">{tNav('experiences')}</Link></li>
              <li><Link href="/gallery" className="hover:text-cloud">{tNav('gallery')}</Link></li>
              <li><Link href="/about" className="hover:text-cloud">{tNav('about')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-cloud/50 mb-4">
              {t('contact')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>{tContact('emailValue')}</li>
              <li>{tContact('phoneValue')}</li>
              <li className="text-cloud/50 text-xs pt-2">{tContact('hoursValue')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cloud/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-cloud/50">
          <div>
            © {year} {tBrand('name')}. {t('rights')}.
          </div>
          <div className="flex gap-6">
            <Link href="/contact" className="hover:text-cloud">{t('contact')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
