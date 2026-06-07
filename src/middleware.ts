import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next, _vercel (internal Next.js / Vercel paths)
  // - the root `/` redirect
  // - static files (e.g. images, fonts, icons)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
