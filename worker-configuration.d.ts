// Type definitions for Cloudflare bindings.
// Re-run `npx wrangler types --env-interface CloudflareEnv` after wrangler.jsonc changes
// to keep this file in sync.

interface CloudflareEnv {
  /** D1 database binding (binding name from wrangler.jsonc) */
  DB: D1Database;
  /** Static assets (from .open-next/assets) */
  ASSETS: Fetcher;
  /** Local-dev flag set in .dev.vars */
  NEXTJS_ENV?: string;
  /** Turnstile public site key (set in wrangler.jsonc vars) */
  TURNSTILE_SITE_KEY?: string;
  /** Turnstile secret (set via `wrangler secret put TURNSTILE_SECRET_KEY` or Dashboard) */
  TURNSTILE_SECRET_KEY?: string;
  /** Resend API key for outbound booking confirmation emails */
  RESEND_API_KEY?: string;
  /** Outbound "From" address, e.g. "归林山居 <booking@forestretreat.cn>" */
  EMAIL_FROM?: string;
  /** Hotel inbox that receives the CC + reply-to */
  HOTEL_INBOX?: string;
}
