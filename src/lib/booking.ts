// Single source of truth for room data + price.
// Used by both the static room pages and the booking Server Action.

export type RoomId = 'suite' | 'double' | 'twin';

export interface Room {
  id: RoomId;
  pricePerNight: number; // CNY
}

export const ROOMS: Record<RoomId, Room> = {
  suite: { id: 'suite', pricePerNight: 1280 },
  double: { id: 'double', pricePerNight: 880 },
  twin: { id: 'twin', pricePerNight: 780 },
};

export const ROOM_IDS: RoomId[] = ['suite', 'double', 'twin'];

export const isRoomId = (v: unknown): v is RoomId =>
  typeof v === 'string' && (ROOM_IDS as string[]).includes(v);

/** Compute nights between two ISO date strings (YYYY-MM-DD). Min 1. */
export function computeNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00Z').getTime();
  const b = new Date(checkOut + 'T00:00:00Z').getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 86400000);
}

/** Compute total CNY. Returns 0 if inputs invalid. */
export function computeTotal(
  roomId: RoomId,
  nights: number,
  guests: number,
): number {
  const room = ROOMS[roomId];
  if (!room || nights <= 0 || guests <= 0) return 0;
  return room.pricePerNight * nights * guests;
}
