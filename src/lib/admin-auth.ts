/**
 * Admin auth — password hashing + signed session tokens.
 *
 * - Passwords: PBKDF2-SHA256, 100,000 iterations, 16-byte random salt.
 *   Uses Web Crypto API (works on Cloudflare Workers + Node 18+).
 *   Algorithm tag stored in DB: "pbkdf2-sha256-100k" so we can rotate later.
 *
 * - Sessions: stateless HMAC-SHA256-signed tokens, format `<userId>.<expiresAt>.<sig>`.
 *   Cookie name: `admin_session`. HttpOnly, Secure (prod), SameSite=Lax, 7 days.
 *   No server-side store — invalidating requires rotating ADMIN_SESSION_SECRET.
 *
 * - ADMIN_SESSION_SECRET must be set as a Workers Secret in production
 *   and as ADMIN_SESSION_SECRET in .dev.vars for local dev.
 */

import type { D1Database } from '@cloudflare/workers-types';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_KEY_BITS = 256;
const SALT_BYTES = 16;
const ALGO_TAG = 'pbkdf2-sha256-100k';

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  password_salt: string;
  password_algo: string;
  must_change_password: number;
  last_login_at: string | null;
  failed_login_count: number;
  locked_until: string | null;
}

const enc = new TextEncoder();

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    PBKDF2_KEY_BITS,
  );
  return toHex(derivedBits);
}

/** Hash a new password; returns `{ hash, salt, algo }` ready for DB INSERT/UPDATE. */
export async function hashPassword(password: string): Promise<{
  hash: string;
  salt: string;
  algo: string;
}> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, saltBytes);
  return { hash, salt: toHex(saltBytes), algo: ALGO_TAG };
}

/** Constant-time verify. Returns false on any mismatch or unknown algo. */
export async function verifyPassword(
  password: string,
  expectedHashHex: string,
  saltHex: string,
  algo: string,
): Promise<boolean> {
  if (algo !== ALGO_TAG) return false; // Future-proofing: refuse unknown algos
  const hash = await pbkdf2(password, fromHex(saltHex));
  return constantTimeEqual(hash, expectedHashHex);
}

// ---- Session ----

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toHex(sig);
}

async function hmacVerify(
  secret: string,
  payload: string,
  expectedSigHex: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return constantTimeEqual(toHex(sig), expectedSigHex);
}

export async function getSessionSecret(): Promise<string | null> {
  try {
    const { env } = await import('@opennextjs/cloudflare').then((m) =>
      m.getCloudflareContext({ async: true }),
    );
    return env.ADMIN_SESSION_SECRET ?? null;
  } catch {
    return null;
  }
}

/** Issue a signed session token (no DB write). */
export async function signSession(
  userId: number,
  secret: string,
): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const sig = await hmacSign(secret, payload);
  return { token: `${payload}.${sig}`, expiresAt };
}

export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<{ userId: number; expiresAt: number } | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userIdStr, expiresAtStr, sig] = parts;
  const userId = Number(userIdStr);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(userId) || userId <= 0) return null;
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const ok = await hmacVerify(secret, `${userIdStr}.${expiresAtStr}`, sig);
  if (!ok) return null;
  return { userId, expiresAt };
}

// ---- DB helpers ----

export async function findAdminByUsername(
  db: D1Database,
  username: string,
): Promise<AdminUser | null> {
  return db
    .prepare('SELECT * FROM admin_users WHERE username = ?')
    .bind(username)
    .first<AdminUser>();
}

export async function findAdminById(
  db: D1Database,
  id: number,
): Promise<AdminUser | null> {
  return db
    .prepare('SELECT * FROM admin_users WHERE id = ?')
    .bind(id)
    .first<AdminUser>();
}

export async function setAdminPassword(
  db: D1Database,
  userId: number,
  newPassword: string,
): Promise<void> {
  const { hash, salt, algo } = await hashPassword(newPassword);
  await db
    .prepare(
      `UPDATE admin_users
         SET password_hash = ?, password_salt = ?, password_algo = ?,
             must_change_password = 0
       WHERE id = ?`,
    )
    .bind(hash, salt, algo, userId)
    .run();
}

export async function recordSuccessfulLogin(
  db: D1Database,
  userId: number,
): Promise<void> {
  await db
    .prepare(
      `UPDATE admin_users
         SET last_login_at = datetime('now'),
             failed_login_count = 0,
             locked_until = NULL
       WHERE id = ?`,
    )
    .bind(userId)
    .run();
}

/** Throttling: lock the account after 5 failed attempts for 15 minutes. */
const MAX_FAILED = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function recordFailedLogin(
  db: D1Database,
  user: AdminUser,
): Promise<void> {
  const next = (user.failed_login_count ?? 0) + 1;
  const lockedUntil =
    next >= MAX_FAILED
      ? new Date(Date.now() + LOCKOUT_MS).toISOString()
      : user.locked_until;
  await db
    .prepare(
      `UPDATE admin_users
         SET failed_login_count = ?, locked_until = ?
       WHERE id = ?`,
    )
    .bind(next, lockedUntil, user.id)
    .run();
}

export function isAccountLocked(user: AdminUser): boolean {
  if (!user.locked_until) return false;
  return new Date(user.locked_until).getTime() > Date.now();
}

// ---- Cookie helpers ----

export interface CookieOptions {
  secure: boolean;
}

export function buildSessionCookie(
  token: string,
  expiresAt: number,
  opts: CookieOptions,
): string {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];
  if (opts.secure) parts.push('Secure');
  return parts.join('; ');
}

export function buildLogoutCookie(opts: CookieOptions): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    `SameSite=Lax`,
    'Max-Age=0',
  ];
  if (opts.secure) parts.push('Secure');
  return parts.join('; ');
}