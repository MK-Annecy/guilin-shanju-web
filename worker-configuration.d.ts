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
  /** Optional notification email (set in Cloudflare dashboard later) */
  NOTIFY_EMAIL?: string;
}
