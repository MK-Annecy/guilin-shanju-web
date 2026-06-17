import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-session';
import { getD1 } from '@/lib/d1';

export const dynamic = 'force-dynamic';

interface BookingRow {
  id: number;
  booking_ref: string;
  room_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_cny: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  status: string;
  locale: string;
  created_at: string;
}

async function loadRecentBookings(): Promise<BookingRow[]> {
  try {
    const db = await getD1();
    const { results } = await db
      .prepare(
        `SELECT id, booking_ref, room_id, check_in, check_out, nights, guests,
                total_cny, guest_name, guest_email, guest_phone, status,
                locale, created_at
           FROM bookings
          ORDER BY id DESC
          LIMIT 50`,
      )
      .all<BookingRow>();
    return results ?? [];
  } catch {
    return [];
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理',
  confirmed: '已确认',
  cancelled: '已取消',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'text-amber-700 border-amber-300',
  confirmed: 'text-moss border-moss',
  cancelled: 'text-ink-mute border-line',
};

export default async function BookingsPage() {
  await requireAdmin();
  const rows = await loadRecentBookings();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-2">订单管理</h1>
          <p className="text-sm text-ink-mute">
            最近 50 条预订。确认、取消、详情等操作下一步开放。
          </p>
        </div>
        <div className="text-xs text-ink-mute">
          共 {rows.length} 条
        </div>
      </header>

      <div className="border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cloud-dark text-ink-mute">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">编号</th>
              <th className="px-4 py-3 font-medium">房型</th>
              <th className="px-4 py-3 font-medium">入住 / 退房</th>
              <th className="px-4 py-3 font-medium">客人</th>
              <th className="px-4 py-3 font-medium text-right">金额</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">提交时间</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-mute">
                  暂无订单
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="border-t border-line hover:bg-cloud-dark/50">
                  <td className="px-4 py-3 font-mono text-xs">{b.booking_ref}</td>
                  <td className="px-4 py-3">
                    {b.room_id === 'suite'
                      ? '山景套房'
                      : b.room_id === 'double'
                      ? '林景大床房'
                      : b.room_id === 'twin'
                      ? '森系双床房'
                      : b.room_id}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{b.check_in}</div>
                    <div className="text-ink-mute">→ {b.check_out}</div>
                    <div className="text-ink-mute">{b.nights} 晚 / {b.guests} 人</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{b.guest_name}</div>
                    <div className="text-xs text-ink-mute">{b.guest_email}</div>
                    <div className="text-xs text-ink-mute">{b.guest_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ¥{b.total_cny.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        'inline-block px-2 py-0.5 text-xs border',
                        STATUS_CLASS[b.status] ?? 'border-line text-ink-mute',
                      ].join(' ')}
                    >
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-mute">
                    {(b.created_at ?? '').replace('T', ' ').slice(0, 16)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-mute">
        提示：完整订单操作（确认 / 取消 / 改期 / 发邮件）将在下一步开发。当前仅展示。
      </p>
      <div className="text-sm">
        <Link href="/admin" className="text-moss hover:text-moss-dark underline-offset-2 hover:underline">
          ← 返回概览
        </Link>
      </div>
    </div>
  );
}