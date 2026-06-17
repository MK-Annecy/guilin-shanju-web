import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-session';
import { getD1 } from '@/lib/d1';

export const dynamic = 'force-dynamic';

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  upcomingRevenue: number;
  upcomingNights: number;
}

async function loadStats(): Promise<Stats> {
  try {
    const db = await getD1();
    const today = new Date().toISOString().slice(0, 10);
    const [counts, upcoming] = await Promise.all([
      db
        .prepare(
          `SELECT status, COUNT(*) AS n FROM bookings GROUP BY status`,
        )
        .all<{ status: string; n: number }>(),
      db
        .prepare(
          `SELECT COUNT(*) AS n, COALESCE(SUM(total_cny),0) AS revenue
             FROM bookings
            WHERE check_in >= ? AND status != 'cancelled'`,
        )
        .bind(today)
        .all<{ n: number; revenue: number }>(),
    ]);
    const map: Record<string, number> = {};
    for (const r of counts.results ?? []) map[r.status] = r.n;
    return {
      total: Object.values(map).reduce((a, b) => a + b, 0),
      pending: map['pending'] ?? 0,
      confirmed: map['confirmed'] ?? 0,
      cancelled: map['cancelled'] ?? 0,
      upcomingNights: (upcoming.results?.[0]?.n as number) ?? 0,
      upcomingRevenue: (upcoming.results?.[0]?.revenue as number) ?? 0,
    };
  } catch {
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      upcomingNights: 0,
      upcomingRevenue: 0,
    };
  }
}

export default async function AdminHomePage() {
  const me = await requireAdmin();
  const stats = await loadStats();
  // Server-side source of truth: must_change_password in DB
  const mustChange = me.must_change_password === 1;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl text-ink mb-2">概览</h1>
        <p className="text-sm text-ink-mute">
          欢迎回来，{me.username}。今天是 {new Date().toLocaleDateString('zh-CN')}。
        </p>
      </header>

      {mustChange && (
        <div className="border border-amber-300 bg-amber-50 px-5 py-4 text-sm">
          <div className="font-medium text-amber-900 mb-1">请尽快修改初始密码</div>
          <p className="text-amber-800 mb-3">
            这是您的首次登录，为了账户安全，建议立即修改初始密码。
          </p>
          <Link
            href="/admin/change-password?first=1"
            className="inline-block px-4 py-2 bg-amber-700 text-cloud text-xs hover:bg-amber-800"
          >
            立即修改
          </Link>
        </div>
      )}

      <section>
        <h2 className="text-xs tracking-[0.25em] uppercase text-ink-mute mb-3">
          订单概览
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="待处理" value={stats.pending} accent="text-amber-700" />
          <Stat label="已确认" value={stats.confirmed} accent="text-moss" />
          <Stat label="已取消" value={stats.cancelled} accent="text-ink-mute" />
          <Stat label="总订单" value={stats.total} accent="text-ink" />
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-[0.25em] uppercase text-ink-mute mb-3">
          未来订单
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cloud-dark border border-line p-5">
            <div className="text-xs text-ink-mute mb-1">待入住订单数</div>
            <div className="font-serif text-2xl text-ink">{stats.upcomingNights}</div>
          </div>
          <div className="bg-cloud-dark border border-line p-5">
            <div className="text-xs text-ink-mute mb-1">待入住金额（CNY）</div>
            <div className="font-serif text-2xl text-ink">
              ¥{stats.upcomingRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-[0.25em] uppercase text-ink-mute mb-3">
          功能模块
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ModuleCard
            title="订单管理"
            description="查看、确认、取消预订"
            href="/admin/bookings"
            status="ready"
          />
          <ModuleCard
            title="房间维护"
            description="房型信息、图片、描述"
            status="soon"
          />
          <ModuleCard
            title="房价维护"
            description="基础价、季节价、加价规则"
            status="soon"
          />
          <ModuleCard
            title="预订与取消政策"
            description="取消时限、罚金规则"
            status="soon"
          />
          <ModuleCard
            title="促销设置"
            description="折扣码、长住优惠"
            status="soon"
          />
          <ModuleCard
            title="修改密码"
            description="修改管理员密码"
            href="/admin/change-password"
            status="ready"
          />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-cloud-dark border border-line p-5">
      <div className="text-xs text-ink-mute mb-1">{label}</div>
      <div className={`font-serif text-3xl ${accent}`}>{value}</div>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  href,
  status,
}: {
  title: string;
  description: string;
  href?: string;
  status: 'ready' | 'soon';
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="font-serif text-lg text-ink">{title}</div>
        <span
          className={[
            'text-[10px] uppercase tracking-wider px-2 py-0.5 border',
            status === 'ready'
              ? 'border-moss text-moss'
              : 'border-line text-ink-mute/60',
          ].join(' ')}
        >
          {status === 'ready' ? '已上线' : '即将开放'}
        </span>
      </div>
      <div className="text-sm text-ink-mute">{description}</div>
    </>
  );
  if (status === 'soon' || !href) {
    return (
      <div className="border border-line bg-cloud-dark/50 p-5 opacity-70">
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="block border border-line bg-cloud-dark p-5 hover:border-moss transition-colors"
    >
      {inner}
    </Link>
  );
}