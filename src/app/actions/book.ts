'use server';

import { randomBytes } from 'node:crypto';
import { getD1 } from '@/lib/d1';
import {
  ROOMS,
  type RoomId,
  computeNights,
  computeTotal,
  isRoomId,
} from '@/lib/booking';

export type BookResult =
  | { ok: true; bookingRef: string; totalCny: number; nights: number }
  | { ok: false; error: string };

export interface BookInput {
  roomId: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  guests: number;
  name: string;
  phone: string;
  email: string;
  remarks?: string;
  locale: 'zh' | 'en';
}

/**
 * Generate a human-friendly booking reference.
 * Format: GL-YYYYMMDD-XXXX (4-char base32 random, uppercase, no ambiguous chars)
 */
function generateBookingRef(): string {
  const now = new Date();
  const ymd =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0');
  // base32 crockford-ish: drop 0/O/1/I/L
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = randomBytes(4);
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }
  return `GL-${ymd}-${suffix}`;
}

// ---- Validation helpers (pure) ----

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9\-\s()]{6,20}$/;

function validate(input: BookInput): { ok: true } | { ok: false; error: string } {
  if (!isRoomId(input.roomId)) {
    return { ok: false, error: 'Invalid room.' };
  }
  if (!ISO_DATE.test(input.checkIn) || !ISO_DATE.test(input.checkOut)) {
    return { ok: false, error: 'Invalid date format.' };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (input.checkIn < today) {
    return { ok: false, error: 'Check-in must be today or later.' };
  }
  if (input.checkOut <= input.checkIn) {
    return { ok: false, error: 'Check-out must be after check-in.' };
  }
  if (input.guests < 1 || input.guests > 4) {
    return { ok: false, error: 'Guests must be 1-4.' };
  }
  const name = input.name.trim();
  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: 'Name is required (1-60 chars).' };
  }
  if (!PHONE_RE.test(input.phone)) {
    return { ok: false, error: 'Invalid phone number.' };
  }
  if (!EMAIL_RE.test(input.email)) {
    return { ok: false, error: 'Invalid email.' };
  }
  return { ok: true };
}

// ---- Server Action ----

/**
 * Persist a booking request to D1.
 * Returns a human-friendly booking ref the guest can quote in correspondence.
 */
export async function submitBooking(input: BookInput): Promise<BookResult> {
  const v = validate(input);
  if (!v.ok) return { ok: false, error: v.error };

  const roomId = input.roomId as RoomId;
  const room = ROOMS[roomId];
  const nights = computeNights(input.checkIn, input.checkOut);
  const totalCny = computeTotal(roomId, nights, input.guests);
  if (totalCny <= 0) {
    return { ok: false, error: 'Invalid stay length.' };
  }

  const bookingRef = generateBookingRef();

  let db;
  try {
    db = await getD1();
  } catch (err) {
    return {
      ok: false,
      error:
        'Database is not configured. Please run the wrangler migrations first (see README).',
    };
  }

  try {
    // Retry once on the (very rare) booking-ref collision
    let attempt = 0;
    let ref = bookingRef;
    while (attempt < 3) {
      const res = await db
        .prepare(
          `INSERT INTO bookings (
            booking_ref, room_id, room_name, check_in, check_out, nights, guests,
            price_per_night, total_cny, guest_name, guest_phone, guest_email,
            remarks, status, locale
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        )
        .bind(
          ref,
          roomId,
          roomId, // room name from i18n at render time
          input.checkIn,
          input.checkOut,
          nights,
          input.guests,
          room.pricePerNight,
          totalCny,
          input.name.trim(),
          input.phone.trim(),
          input.email.trim(),
          input.remarks?.trim() || null,
          input.locale,
        )
        .run();
      if (res.success) return { ok: true, bookingRef: ref, totalCny, nights };
      // Ref collision → regenerate and retry
      ref = generateBookingRef();
      attempt++;
    }
    return { ok: false, error: 'Could not allocate a booking reference. Please retry.' };
  } catch (err) {
    console.error('submitBooking failed:', err);
    return { ok: false, error: 'Booking failed. Please try again or contact us directly.' };
  }
}

/**
 * Local dev / preview helper.
 * When the DB is unreachable, returns a mock success so the UI flow can be tested.
 * In production this branch is unreachable (DB is always present).
 */
export async function submitBookingWithFallback(input: BookInput): Promise<BookResult> {
  const result = await submitBooking(input);
  if (result.ok) return result;
  // Dev fallback: only if the error is a DB-config issue
  if (
    process.env.NODE_ENV !== 'production' &&
    (result.error.includes('not configured') ||
      result.error.includes('D1 not available'))
  ) {
    const roomId = input.roomId as RoomId;
    const nights = computeNights(input.checkIn, input.checkOut);
    const totalCny = computeTotal(roomId, nights, input.guests);
    return {
      ok: true,
      bookingRef: 'GL-DEV-' + Date.now().toString(36).toUpperCase(),
      totalCny,
      nights,
    };
  }
  return result;
}
