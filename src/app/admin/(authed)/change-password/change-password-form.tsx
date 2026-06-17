'use client';

import { useActionState } from 'react';
import { changePasswordAction, type ChangePasswordFormState } from '../../actions';

const initial: ChangePasswordFormState = { error: null, success: null };

export function ChangePasswordForm({ isFirstLogin }: { isFirstLogin: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      {isFirstLogin && (
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3">
          首次登录，请修改初始密码后再继续。
        </p>
      )}
      <div>
        <label
          htmlFor="current"
          className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2"
        >
          当前密码
        </label>
        <input
          id="current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 bg-cloud border border-line focus:border-moss focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="next"
          className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2"
        >
          新密码（至少 8 位）
        </label>
        <input
          id="next"
          name="next"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-4 py-3 bg-cloud border border-line focus:border-moss focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="confirm"
          className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2"
        >
          确认新密码
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-4 py-3 bg-cloud border border-line focus:border-moss focus:outline-none"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-moss bg-moss/5 border border-moss/30 px-3 py-2">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-6 py-3 bg-moss text-cloud hover:bg-moss-dark transition-colors disabled:opacity-50 tracking-wide"
      >
        {pending ? '保存中…' : '保存新密码'}
      </button>
    </form>
  );
}