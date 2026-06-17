/**
 * Server-only admin session helpers.
 * Use from server components, layouts, and Server Actions.
 */
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE,
  findAdminById,
  getSessionSecret,
  verifySession,
  type AdminUser,
} from '@/lib/admin-auth';
export { getSessionSecret };
import { getD1 } from '@/lib/d1';

function isSecureRequest(): boolean {
  // When proxied by Cloudflare, NODE_ENV is `production` and req is HTTPS.
  // For local dev with `next dev`, http://localhost:3000 is fine without Secure flag.
  return process.env.NODE_ENV === 'production';
}

/**
 * Read + verify the session cookie, return the matching admin user, or null.
 * Does not redirect.
 */
export async function getAdminFromCookie(): Promise<AdminUser | null> {
  const secret = await getSessionSecret();
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, secret);
  if (!session) return null;
  const db = await getD1();
  const user = await findAdminById(db, session.userId);
  if (!user) return null;
  // Account lock check
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    return null;
  }
  return user;
}

/**
 * Require an authenticated admin. Redirects to /admin/login if not authed.
 * Use in admin layouts and protected server actions.
 */
export async function requireAdmin(redirectTo: string = '/admin/login'): Promise<AdminUser> {
  const user = await getAdminFromCookie();
  if (!user) redirect(redirectTo);
  return user;
}

export { isSecureRequest };