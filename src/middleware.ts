import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * 根据 Accept-Language header 推断语言。
 * 优先级：用户 cookie 手动选择 > 浏览器语言 > 默认中文
 * 接受 zh / zh-CN / zh-TW / zh-HK / en / en-US / en-GB 等
 */
function detectLocale(request: NextRequest): 'zh' | 'en' {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale === 'zh' || cookieLocale === 'en') {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get('accept-language') || '';
  // 仅在明确英语时返回 en；其他（含中文/未设置）一律 zh
  if (/(?:^|,)\s*en(?:[-;]|\b)/i.test(acceptLanguage)) {
    return 'en';
  }
  return 'zh';
}

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

  // 2) 仅在根路径做浏览器语言自动检测
  //    /zh/*、/en/* 走 next-intl，不在此拦截（用户已明确选过语言）
  if (request.nextUrl.pathname === '/') {
    const locale = detectLocale(request);
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // 3) 其他路径交给 next-intl 处理 i18n
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next, _vercel (internal Next.js / Vercel paths)
  // - static files (e.g. images, fonts, icons)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
