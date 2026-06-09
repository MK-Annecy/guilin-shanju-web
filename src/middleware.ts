import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // 1) www → apex 301 重定向（SEO 集中权重）
  if (host.startsWith('www.')) {
    const apexHost = host.slice(4);
    const url = request.nextUrl.clone();
    url.host = apexHost;
    url.protocol = 'https';
    return NextResponse.redirect(url, 301);
  }

  // 2) 否则交给 next-intl 处理 i18n
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next, _vercel (internal Next.js / Vercel paths)
  // - static files (e.g. images, fonts, icons)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
