import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getAdminFromCookie } from '@/lib/admin-session';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '管理后台登录 · 归林山居',
};

// Forest backdrop image — same visual language as the public site hero.
const BACKDROP_URL =
  'https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2400';

export default async function LoginPage() {
  // If already authed, send to dashboard
  const me = await getAdminFromCookie();
  if (me) redirect('/admin');

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ink">
      {/* Background image with gradient — matches public-site hero */}
      <div className="absolute inset-0">
        <Image
          src={BACKDROP_URL}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/40 to-ink/80" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Top eyebrow */}
        <header className="pt-10 px-6 md:px-10 text-center">
          <div className="text-xs md:text-sm tracking-[0.4em] uppercase text-cloud/70">
            Gui Lin Shan Ju · Admin Console
          </div>
        </header>

        {/* Centered card */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Brand block */}
            <div className="text-center mb-10">
              <h1 className="font-serif text-5xl md:text-6xl font-light text-cloud mb-3 tracking-wide">
                归林山居
              </h1>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="h-px w-10 bg-wood/60" />
                <span className="text-xs tracking-[0.35em] uppercase text-cloud/60">
                  Admin
                </span>
                <span className="h-px w-10 bg-wood/60" />
              </div>
              <p className="text-sm text-cloud/70 font-light">
                内部管理后台 · 请使用授权账号登录
              </p>
            </div>

            {/* Form card — frosted glass */}
            <div className="bg-cloud/95 backdrop-blur-sm border border-cloud/20 p-8 md:p-10 shadow-2xl">
              <LoginForm />
            </div>

            {/* Footer note */}
            <p className="text-xs text-cloud/50 mt-8 text-center leading-relaxed">
              仅限内部人员访问
              <br />
              如需账号请联系运维
            </p>
          </div>
        </main>

        {/* Bottom signature */}
        <footer className="pb-8 px-6 md:px-10 text-center">
          <div className="text-[10px] tracking-[0.3em] uppercase text-cloud/40">
            forestretreat.cn · 云雾深处，归于山林
          </div>
        </footer>
      </div>
    </div>
  );
}