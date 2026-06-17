// Email service — Cloudflare Email Service (Beta, launched 2025-09-26).
// Bound via wrangler.jsonc `send_email: [{ "name": "EMAIL", "remote": true }]`.
// Domain (forestretreat.cn) must be on Cloudflare DNS — SPF/DKIM/DMARC auto-managed.
// Pricing: Workers Paid ($5/mo) + $0.35 / 1000 emails.
//
// IMPORTANT (per project decision 2026-06-16):
// - From MUST stay "Booking <noreply@forestretreat.cn>". Do NOT change to a
//   sub-domain like send@ — the "由 cf-bounce.forestretreat.cn 代发" hint
//   shown by 126 mail is a client-side styling choice, not an SPF/DKIM issue.
// - The platform MUST stay Cloudflare Email Service (not Resend/Mailgun/MailChannels).
//
// API shape (Workers binding, NOT the REST API which uses {address, name}):
//   env.EMAIL.send({ to, from, cc, replyTo, subject, html, text })

import type { SendEmail, EmailAddress } from '@cloudflare/workers-types';

export interface BookingEmailInput {
  bookingRef: string;
  guestName: string;
  guestEmail: string;
  roomId: 'suite' | 'double' | 'twin';
  roomName: string;        // i18n-resolved
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalCny: number;
  pricePerNight: number;
  remarks?: string;
  locale: 'zh' | 'en';
}

export interface SendResult {
  ok: boolean;
  /** Cloudflare returns `{ success: true }` on accept; no message id in Workers API */
  error?: string;
}

const ROOM_NAME_EN: Record<string, string> = {
  suite: 'Mountain View Suite',
  double: 'Forest View King',
  twin: 'Forest Twin',
};
const ROOM_NAME_ZH: Record<string, string> = {
  suite: '山景套房',
  double: '林景大床房',
  twin: '森系双床房',
};

/**
 * Parse a "Name <addr@host>" string into an EmailAddress.
 * Falls back to bare email if no angle-bracket name present.
 */
function parseAddress(s: string, defaultName?: string): EmailAddress {
  const m = s.match(/^\s*([^<]*?)\s*<\s*([^>]+?)\s*>\s*$/);
  if (m) {
    const name = m[1].trim().replace(/^"|"$/g, '');
    return { email: m[2].trim(), name: name || (defaultName ?? '') };
  }
  return { email: s.trim(), name: defaultName ?? '' };
}

/**
 * Send the booking confirmation email via Cloudflare Email Service.
 * Returns { ok: true } when Cloudflare accepts the message; never throws.
 */
export async function sendBookingConfirmation(
  input: BookingEmailInput,
  emailBinding: SendEmail,
  fromAddress: string,
  hotelInbox: string,
): Promise<SendResult> {
  const { subject, html, text } = input.locale === 'zh'
    ? buildZh(input)
    : buildEn(input);

  const from = parseAddress(fromAddress, 'Booking');
  const replyTo = parseAddress(hotelInbox, '归林山居');

  try {
    await emailBinding.send({
      to: { email: input.guestEmail, name: input.guestName },
      from,
      cc: [{ email: hotelInbox, name: '归林山居' }],
      replyTo,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (err) {
    console.error('[email] Cloudflare Email Service send failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

// ---- Templates ----

function buildZh(input: BookingEmailInput) {
  const roomName = ROOM_NAME_ZH[input.roomId] ?? input.roomName;
  const subject = `预订确认 · ${roomName} · ${input.bookingRef}`;
  const text = [
    `${input.guestName} 您好，`,
    ``,
    `我们已收到您的预订请求，预订编号：${input.bookingRef}`,
    ``,
    `【预订详情】`,
    `房型：${roomName}`,
    `入住：${input.checkIn}`,
    `退房：${input.checkOut}`,
    `共 ${input.nights} 晚 / ${input.guests} 人`,
    `单价：¥${input.pricePerNight.toLocaleString()} / 晚`,
    `总价：¥${input.totalCny.toLocaleString()}`,
    input.remarks ? `备注：${input.remarks}` : '',
    ``,
    `我们将在 24 小时内与您电话或邮件联系，确认预订细节。`,
    `如有任何问题，请回复此邮件或致电 +86-191 1623 6513。`,
    ``,
    `归林山居`,
    `service@forestretreat.cn`,
    `https://forestretreat.cn`,
  ].filter(Boolean).join('\n');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#3F3F3F;line-height:1.7;background:#F5F5F0;">
  <div style="text-align:center;padding:24px 0;border-bottom:1px solid #D8D8D0;">
    <div style="font-family:Georgia,serif;font-size:28px;color:#3F5640;letter-spacing:0.05em;">归林山居</div>
    <div style="font-size:12px;color:#8B6F47;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px;">GUI LIN SHAN JU</div>
  </div>
  <div style="padding:32px 0;">
    <p style="font-size:16px;">${input.guestName} 您好，</p>
    <p>我们已收到您的预订请求，预订编号：</p>
    <div style="text-align:center;margin:24px 0;padding:16px;background:#fff;border:1px solid #D8D8D0;">
      <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#6A6A6A;margin-bottom:6px;">预订编号 BOOKING REFERENCE</div>
      <div style="font-family:Menlo,Consolas,monospace;font-size:22px;color:#3F5640;letter-spacing:0.1em;">${input.bookingRef}</div>
    </div>
    <h3 style="font-family:Georgia,serif;color:#3F5640;border-bottom:1px solid #D8D8D0;padding-bottom:8px;margin-top:32px;">预订详情</h3>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:8px 0;color:#6A6A6A;width:30%;">房型</td><td style="padding:8px 0;color:#3F3F3F;">${roomName}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">入住</td><td style="padding:8px 0;">${input.checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">退房</td><td style="padding:8px 0;">${input.checkOut}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">晚数</td><td style="padding:8px 0;">${input.nights} 晚</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">人数</td><td style="padding:8px 0;">${input.guests} 人</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">单价</td><td style="padding:8px 0;">¥${input.pricePerNight.toLocaleString()} / 晚</td></tr>
      ${input.remarks ? `<tr><td style="padding:8px 0;color:#6A6A6A;vertical-align:top;">备注</td><td style="padding:8px 0;">${escapeHtml(input.remarks)}</td></tr>` : ''}
    </table>
    <div style="margin-top:24px;padding:16px;background:#5C7A5C;color:#F5F5F0;text-align:center;">
      <div style="font-size:13px;letter-spacing:0.2em;">总价 TOTAL</div>
      <div style="font-family:Georgia,serif;font-size:32px;margin-top:6px;">¥${input.totalCny.toLocaleString()}</div>
    </div>
    <p style="margin-top:32px;">我们将在 24 小时内与您电话或邮件联系，确认预订细节。</p>
    <p>如有任何问题，请回复此邮件或致电 <strong>+86-191 1623 6513</strong>。</p>
  </div>
  <div style="border-top:1px solid #D8D8D0;padding:24px 0;font-size:12px;color:#8B6F47;text-align:center;">
    <div>归林山居 · Gui Lin Shan Ju</div>
    <div style="margin-top:4px;">service@forestretreat.cn · https://forestretreat.cn</div>
  </div>
</body></html>`;
  return { subject, html, text };
}

function buildEn(input: BookingEmailInput) {
  const roomName = ROOM_NAME_EN[input.roomId] ?? input.roomName;
  const subject = `Booking Confirmation · ${roomName} · ${input.bookingRef}`;
  const text = [
    `Hello ${input.guestName},`,
    ``,
    `We've received your booking request. Reference: ${input.bookingRef}`,
    ``,
    `[Booking Details]`,
    `Room: ${roomName}`,
    `Check-in: ${input.checkIn}`,
    `Check-out: ${input.checkOut}`,
    `${input.nights} nights / ${input.guests} guests`,
    `Rate: ¥${input.pricePerNight.toLocaleString()} / night`,
    `Total: ¥${input.totalCny.toLocaleString()}`,
    input.remarks ? `Notes: ${input.remarks}` : '',
    ``,
    `We'll contact you within 24 hours by phone or email to confirm.`,
    `For any questions, reply to this email or call +86-191 1623 6513.`,
    ``,
    `Gui Lin Shan Ju`,
    `service@forestretreat.cn`,
    `https://forestretreat.cn`,
  ].filter(Boolean).join('\n');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:24px;color:#3F3F3F;line-height:1.7;background:#F5F5F0;">
  <div style="text-align:center;padding:24px 0;border-bottom:1px solid #D8D8D0;">
    <div style="font-family:Georgia,serif;font-size:28px;color:#3F5640;letter-spacing:0.05em;">Gui Lin Shan Ju</div>
    <div style="font-size:12px;color:#8B6F47;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px;">RETURN TO THE FOREST</div>
  </div>
  <div style="padding:32px 0;">
    <p style="font-size:16px;">Hello ${input.guestName},</p>
    <p>We've received your booking request. Reference:</p>
    <div style="text-align:center;margin:24px 0;padding:16px;background:#fff;border:1px solid #D8D8D0;">
      <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#6A6A6A;margin-bottom:6px;">BOOKING REFERENCE</div>
      <div style="font-family:Menlo,Consolas,monospace;font-size:22px;color:#3F5640;letter-spacing:0.1em;">${input.bookingRef}</div>
    </div>
    <h3 style="font-family:Georgia,serif;color:#3F5640;border-bottom:1px solid #D8D8D0;padding-bottom:8px;margin-top:32px;">Booking Details</h3>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:8px 0;color:#6A6A6A;width:30%;">Room</td><td style="padding:8px 0;color:#3F3F3F;">${roomName}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Check-in</td><td style="padding:8px 0;">${input.checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Check-out</td><td style="padding:8px 0;">${input.checkOut}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Nights</td><td style="padding:8px 0;">${input.nights}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Guests</td><td style="padding:8px 0;">${input.guests}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Rate</td><td style="padding:8px 0;">¥${input.pricePerNight.toLocaleString()} / night</td></tr>
      ${input.remarks ? `<tr><td style="padding:8px 0;color:#6A6A6A;vertical-align:top;">Notes</td><td style="padding:8px 0;">${escapeHtml(input.remarks)}</td></tr>` : ''}
    </table>
    <div style="margin-top:24px;padding:16px;background:#5C7A5C;color:#F5F5F0;text-align:center;">
      <div style="font-size:13px;letter-spacing:0.2em;">TOTAL</div>
      <div style="font-family:Georgia,serif;font-size:32px;margin-top:6px;">¥${input.totalCny.toLocaleString()}</div>
    </div>
    <p style="margin-top:32px;">We'll contact you within 24 hours by phone or email to confirm.</p>
    <p>For any questions, reply to this email or call <strong>+86-191 1623 6513</strong>.</p>
  </div>
  <div style="border-top:1px solid #D8D8D0;padding:24px 0;font-size:12px;color:#8B6F47;text-align:center;">
    <div>Gui Lin Shan Ju · 归林山居</div>
    <div style="margin-top:4px;">service@forestretreat.cn · https://forestretreat.cn</div>
  </div>
</body></html>`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}