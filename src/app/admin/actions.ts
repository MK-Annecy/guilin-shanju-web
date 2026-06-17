'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getD1 } from '@/lib/d1';
import {
  SESSION_COOKIE,
  buildLogoutCookie,
  buildSessionCookie,
  findAdminByUsername,
  isAccountLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  setAdminPassword,
  signSession,
  verifyPassword,
} from '@/lib/admin-auth';
import { getAdminFromCookie, getSessionSecret, isSecureRequest } from '@/lib/admin-session';

// ---------- login ----------

export interface LoginFormState {
  error: string | null;
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    return { error: '请输入用户名和密码' };
  }

  const db = await getD1();
  const user = await findAdminByUsername(db, username);
  if (!user) {
    // Don't reveal whether the username exists
    return { error: '用户名或密码错误' };
  }
  if (isAccountLocked(user)) {
    return {
      error: `账户已锁定，请于 ${new Date(user.locked_until!).toLocaleString('zh-CN')} 后再试`,
    };
  }
  const ok = await verifyPassword(password, user.password_hash, user.password_salt, user.password_algo);
  if (!ok) {
    await recordFailedLogin(db, user);
    return { error: '用户名或密码错误' };
  }
  await recordSuccessfulLogin(db, user.id);

  const secret = await getSessionSecret();
  if (!secret) {
    return { error: '服务器未配置 ADMIN_SESSION_SECRET，请联系运维' };
  }
  const { token, expiresAt } = await signSession(user.id, secret);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(),
    path: '/',
    expires: new Date(expiresAt),
  });

  // If admin must change password, send them to the change-password page first.
  redirect(user.must_change_password === 1 ? '/admin/change-password?first=1' : '/admin');
}

// ---------- logout ----------

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(),
    path: '/',
    maxAge: 0,
  });
  redirect('/admin/login');
}

// ---------- change password ----------

export interface ChangePasswordFormState {
  error?: string | null;
  success?: string | null;
}

export async function changePasswordAction(
  _prevState: ChangePasswordFormState,
  formData: FormData,
): Promise<ChangePasswordFormState> {
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!current || !next || !confirm) {
    return { error: '请填写所有字段' };
  }
  if (next.length < 8) {
    return { error: '新密码至少需要 8 位' };
  }
  if (next !== confirm) {
    return { error: '两次输入的新密码不一致' };
  }
  if (next === current) {
    return { error: '新密码不能与当前密码相同' };
  }

  // Read current user from session
  const me = await getAdminFromCookie();
  if (!me) redirect('/admin/login');

  const db = await getD1();
  const ok = await verifyPassword(current, me.password_hash, me.password_salt, me.password_algo);
  if (!ok) {
    return { error: '当前密码不正确' };
  }

  await setAdminPassword(db, me.id, next);
  return { error: null, success: '密码已更新' };
}