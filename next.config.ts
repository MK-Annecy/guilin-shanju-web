import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const TURNSTILE_SITE_KEY = '0x4AAAAAADkiRMbVH646fdR0';

const nextConfig: NextConfig = {
  // Public env (site key is intentionally client-visible)
  env: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_SITE_KEY,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

// Enables Cloudflare bindings (D1) during `next dev`.
// Required for getCloudflareContext() to work in dev.
// NOTE: This call also intercepts env loading (dotenvx re-load), which is
// why NEXT_PUBLIC_TURNSTILE_SITE_KEY is set above via `env` field instead
// of relying on .env.local.
initOpenNextCloudflareForDev();

export default withNextIntl(nextConfig);
