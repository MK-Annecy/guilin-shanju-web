// D1 binding accessor.
// Uses getCloudflareContext from @opennextjs/cloudflare to access the binding
// at runtime (and local emulation during `wrangler dev` / `next dev`).

import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';

export interface D1Context {
  DB: D1Database;
}

/**
 * Get the D1 binding. Throws clearly if not available
 * (e.g. running `next dev` without initOpenNextCloudflareForDev).
 */
export async function getD1(): Promise<D1Database> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.DB) {
      throw new Error('D1 binding "DB" not found on env. Check wrangler.jsonc.');
    }
    return env.DB as D1Database;
  } catch (err) {
    if (err instanceof Error && err.message.includes('DB')) throw err;
    throw new Error(
      'D1 not available. Did you call initOpenNextCloudflareForDev() in next.config.ts? ' +
        'Or are you running outside the OpenNext runtime?',
    );
  }
}
