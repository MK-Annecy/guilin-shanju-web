'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface TurnstileHandle {
  /** Returns the current token, or empty string if not ready. */
  getToken(): string;
  /** Resets the widget (e.g. after a failed submit). */
  reset(): void;
}

interface Props {
  siteKey: string;
  onTokenChange?: (token: string) => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';

/**
 * Cloudflare Turnstile widget.
 * - Loads the official script once globally.
 * - Renders into a container div.
 * - Exposes getToken/reset via ref so the parent form can read/clear the token.
 */
export const Turnstile = forwardRef<TurnstileHandle, Props>(function Turnstile(
  { siteKey, onTokenChange, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');

  useImperativeHandle(ref, () => ({
    getToken: () => tokenRef.current,
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      tokenRef.current = '';
      onTokenChange?.('');
    },
  }));

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    // 1. Load the Turnstile script once (idempotent)
    const ensureScript = (): Promise<void> =>
      new Promise((resolve) => {
        if (window.turnstile) {
          resolve();
          return;
        }
        // Expose onload hook
        (window as any).onTurnstileLoad = () => resolve();
        if (document.querySelector(`script[src^="${SCRIPT_SRC.split('?')[0]}"]`)) {
          // already queued
          return;
        }
        const s = document.createElement('script');
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      });

    ensureScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          tokenRef.current = token;
          onTokenChange?.(token);
        },
        'expired-callback': () => {
          tokenRef.current = '';
          onTokenChange?.('');
        },
        'error-callback': () => {
          tokenRef.current = '';
          onTokenChange?.('');
        },
        theme: 'light',
        size: 'flexible',
      });
      widgetIdRef.current = id;
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [siteKey, onTokenChange]);

  if (!siteKey) {
    return (
      <div className="text-xs text-ink-mute italic">
        Turnstile not configured (TURNSTILE_SITE_KEY missing)
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
});
