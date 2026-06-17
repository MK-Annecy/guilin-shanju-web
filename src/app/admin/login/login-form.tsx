'use client';

import { useActionState } from 'react';
import { loginAction, type LoginFormState } from '../actions';

const initial: LoginFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="username"
          className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2"
        >
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoFocus
          defaultValue=""
          className="w-full px-4 py-3 bg-cloud border border-line focus:border-moss focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="text-xs tracking-[0.2em] uppercase text-ink-mute block mb-2"
        >
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 bg-cloud border border-line focus:border-moss focus:outline-none"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full px-6 py-3 bg-moss text-cloud hover:bg-moss-dark transition-colors disabled:opacity-50 tracking-wide"
      >
        {pending ? '登录中…' : '登录'}
      </button>
    </form>
  );
}