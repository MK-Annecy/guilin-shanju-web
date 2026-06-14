// Email service — Resend (https://resend.com)
// Auth via RESEND_API_KEY secret (set in Cloudflare Workers dashboard or wrangler secret put).
// Sender domain (forestretreat.cn) must be verified in Resend dashboard first.

const RESEND_API_URL = 'https://api.resend.com/emails';

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
  id?: string;
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
 * Send the booking confirmation email to the guest.
 * Also CCs the hotel mailbox so the team has a copy.
 * Fire-and-forget at the call site; this function never throws.
 */
export async function sendBookingConfirmation(
  input: BookingEmailInput,
  resendApiKey: string,
  fromAddress: string,
  hotelInbox: string,
): Promise<SendResult> {
  if (!resendApiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const { subject, html, text } = input.locale === 'zh'
    ? buildZh(input)
    : buildEn(input);

  try {
    const resp = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,                 // e.g. "归林山居 <booking@forestretreat.cn>"
        to: [input.guestEmail],
        cc: [hotelInbox],                  // team copy
        reply_to: hotelInbox,              // guest reply goes to team
        subject,
        html,
        text,
        tags: [
          { name: 'category', value: 'booking-confirmation' },
          { name: 'booking_ref', value: input.bookingRef },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Resend API error:', resp.status, errText);
      return { ok: false, error: `Resend API ${resp.status}: ${errText.slice(0, 200)}` };
    }
    const data = (await resp.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('sendBookingConfirmation failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
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
    <div style="font-size:28px;color:#3F5640;letter-spacing:0.05em;">Gui Lin Shan Ju</div>
    <div style="font-size:12px;color:#8B6F47;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px;">A MOUNTAIN SANCTUARY</div>
  </div>
  <div style="padding:32px 0;">
    <p style="font-size:16px;">Hello ${escapeHtml(input.guestName)},</p>
    <p>Thank you for your booking request. Your reference:</p>
    <div style="text-align:center;margin:24px 0;padding:16px;background:#fff;border:1px solid #D8D8D0;">
      <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#6A6A6A;margin-bottom:6px;">BOOKING REFERENCE</div>
      <div style="font-family:Menlo,Consolas,monospace;font-size:22px;color:#3F5640;letter-spacing:0.1em;">${input.bookingRef}</div>
    </div>
    <h3 style="color:#3F5640;border-bottom:1px solid #D8D8D0;padding-bottom:8px;margin-top:32px;">Booking Details</h3>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:8px 0;color:#6A6A6A;width:35%;">Room</td><td style="padding:8px 0;">${roomName}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Check-in</td><td style="padding:8px 0;">${input.checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Check-out</td><td style="padding:8px 0;">${input.checkOut}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Nights</td><td style="padding:8px 0;">${input.nights}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Guests</td><td style="padding:8px 0;">${input.guests}</td></tr>
      <tr><td style="padding:8px 0;color:#6A6A6A;">Rate</td><td style="padding:8px 0;">¥${input.pricePerNight.toLocaleString()} / night</td></tr>
      ${input.remarks ? `<tr><td style="padding:8px 0;color:#6A6A6A;vertical-align:top;">Notes</td><td style="padding:8px 0;">${escapeHtml(input.remarks)}</td></tr>` : ''}
    </table>
    <div style="margin-top:24px;padding:16px;background:#5C7A5C;color:#F5F5F0;text-align:center;">
      <div style="font-size:13px;letter-spacing:0.2em;">TOTAL</div>
      <div style="font-size:32px;margin-top:6px;">¥${input.totalCny.toLocaleString()}</div>
    </div>
    <p style="margin-top:32px;">We'll contact you within 24 hours by phone or email to confirm your booking.</p>
    <p>For any questions, reply to this email or call <strong>+86-191 1623 6513</strong>.</p>
  </div>
  <div style="border-top:1px solid #D8D8D0;padding:24px 0;font-size:12px;color:#8B6F47;text-align:center;">
    <div>Gui Lin Shan Ju · A Mountain Sanctuary in Pu'er</div>
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
