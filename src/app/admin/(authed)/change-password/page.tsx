import { requireAdmin } from '@/lib/admin-session';
import { ChangePasswordForm } from './change-password-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '修改密码 · 归林山居 Admin',
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const me = await requireAdmin();
  // Server-side source of truth: must_change_password in DB
  // (query param `?first=1` is only a hint that we sent them here from login)
  const isFirstLogin = me.must_change_password === 1;

  return (
    <div className="max-w-md">
      <h1 className="font-serif text-3xl text-ink mb-2">修改密码</h1>
      <p className="text-sm text-ink-mute mb-8">
        建议使用包含大小写字母、数字、符号的强密码，且不要与他人共享。
      </p>
      <ChangePasswordForm isFirstLogin={isFirstLogin} />
    </div>
  );
}