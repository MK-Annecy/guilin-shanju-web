// Server-side Turnstile token verification.
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface SiteverifyResult {
  success: boolean;
  /** Error codes: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/ */
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
  cdata?: string;
}

/**
 * Verify a Turnstile token submitted from the client.
 * Returns the raw siteverify result (only `success` is required by callers).
 */
export async function verifyTurnstileToken(
  token: string,
  secret: string,
  remoteIp?: string,
): Promise<SiteverifyResult> {
  if (!token) {
    return { success: false, 'error-codes': ['missing-input-response'] };
  }
  if (!secret) {
    // Treat as failure but with a clear code so we know it's a server config issue
    return { success: false, 'error-codes': ['server-secret-not-configured'] };
  }

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  try {
    const resp = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!resp.ok) {
      return { success: false, 'error-codes': [`http-${resp.status}`] };
    }
    return (await resp.json()) as SiteverifyResult;
  } catch (err) {
    return { success: false, 'error-codes': ['network-error'] };
  }
}
