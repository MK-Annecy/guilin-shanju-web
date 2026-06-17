import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/admin-session';
import { logoutAction } from '../actions';

export const dynamic = 'force-dynamic';

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  description: string;
  status: 'ready' | 'soon';
}> = [
  { href: '/admin', label: '概览', description: 'Dashboard', status: 'ready' },
  { href: '/admin/bookings', label: '客房订单管理', description: 'Bookings', status: 'ready' },
  { href: '/admin/rooms', label: '房间维护', description: 'Rooms', status: 'soon' },
  { href: '/admin/pricing', label: '房价维护', description: 'Pricing', status: 'soon' },
  { href: '/admin/policies', label: '预订与取消政策', description: 'Policies', status: 'soon' },
  { href: '/admin/promotions', label: '促销设置', description: 'Promotions', status: 'soon' },
];

export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireAdmin('/admin/login');

  // Active route highlight (sidebar reads pathname via header injected by Next.js,
  // but Server Components don't have access to pathname directly — use a workaround).
  const h = await headers();
  const pathname = h.get('x-pathname') ?? h.get('x-invoke-path') ?? h.get('next-url') ?? '/admin';

  return (
    <div className="min-h-screen flex bg-cloud">
      {/* Sidebar */}
      <aside className="w-64 border-r border-line bg-cloud-dark flex flex-col">
        <div className="px-6 py-6 border-b border-line">
          <Link href="/admin" className="block">
            <div className="font-serif text-xl text-moss">归林山居</div>
            <div className="text-xs tracking-[0.25em] uppercase text-ink-mute">
              Admin Console
            </div>
          </Link>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-0.5 px-3">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  {item.status === 'soon' ? (
                    <span
                      title="即将开放"
                      className="flex items-center justify-between px-3 py-2 text-sm text-ink-mute/60 cursor-not-allowed"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-ink-mute/50">
                        soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={[
                        'flex items-center justify-between px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-moss text-cloud'
                          : 'text-ink-soft hover:bg-line/40 hover:text-ink',
                      ].join(' ')}
                    >
                      <span>{item.label}</span>
                      <span
                        className={[
                          'text-[10px] uppercase tracking-wider',
                          active ? 'text-cloud/80' : 'text-ink-mute/60',
                        ].join(' ')}
                      >
                        {item.description}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-4 py-4 border-t border-line">
          <div className="text-xs text-ink-mute mb-1">登录身份</div>
          <div className="text-sm text-ink font-medium mb-3">{me.username}</div>
          <Link
            href="/admin/change-password"
            className="block text-xs text-moss hover:text-moss-dark underline-offset-2 hover:underline mb-2"
          >
            修改密码
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left text-xs text-ink-mute hover:text-ink"
            >
              登出 →
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}