/** Wall-clock time source (structurally satisfies every feature's ClockPort). */
export const systemClock = { now: () => new Date() };
