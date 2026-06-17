import { redirect } from 'next/navigation';
import { getAdminFromCookie } from '@/lib/admin-session';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '管理后台登录 · 归林山居',
};

export default async function LoginPage() {
  // If already authed, send to dashboard
  const me = await getAdminFromCookie();
  if (me) redirect('/admin');

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-serif text-3xl text-moss mb-1">归林山居</div>
          <div className="text-xs tracking-[0.3em] uppercase text-ink-mute">
            Gui Lin Shan Ju · Admin
          </div>
          <div className="mt-4 text-sm text-ink-soft">管理后台登录</div>
        </div>
        <div className="bg-cloud-dark border border-line p-8">
          <LoginForm />
        </div>
        <p className="text-xs text-ink-mute mt-6 text-center">
          仅限内部人员访问。如需账号请联系运维。
        </p>
      </div>
    </div>
  );
}