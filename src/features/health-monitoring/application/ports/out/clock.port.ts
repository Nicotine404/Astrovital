/** Time source, injected so use cases stay deterministic under test. */
export interface ClockPort {
  now(): Date;
}

/** Share of the crew's waking day elapsed (07:00–23:00 mission time, UTC). */
export function dayFraction(now: Date): number {
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  return Math.min(1, Math.max(0, (h - 7) / 16));
}

export const isoDate = (now: Date) => now.toISOString().slice(0, 10);
