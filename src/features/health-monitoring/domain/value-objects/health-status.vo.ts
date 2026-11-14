/** Clinical traffic light: NOMINAL | WARNING | CRITICAL. */
export const HEALTH_STATUSES = ["NOMINAL", "WARNING", "CRITICAL"] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

const RANK: Record<HealthStatus, number> = { NOMINAL: 0, WARNING: 1, CRITICAL: 2 };

export const HealthStatus = {
  NOMINAL: "NOMINAL" as HealthStatus,
  WARNING: "WARNING" as HealthStatus,
  CRITICAL: "CRITICAL" as HealthStatus,

  isValid(value: string): value is HealthStatus {
    return (HEALTH_STATUSES as readonly string[]).includes(value);
  },

  /** The most severe of the given statuses (NOMINAL when empty). */
  worst(...statuses: HealthStatus[]): HealthStatus {
    return statuses.reduce<HealthStatus>((acc, s) => (RANK[s] > RANK[acc] ? s : acc), "NOMINAL");
  },

  rank(status: HealthStatus): number {
    return RANK[status];
  },

  /** Classifies a value against warning/critical limits on the high side. */
  above(value: number, warning: number, critical: number): HealthStatus {
    return value >= critical ? "CRITICAL" : value >= warning ? "WARNING" : "NOMINAL";
  },

  /** Classifies a value against warning/critical limits on the low side. */
  below(value: number, warning: number, critical: number): HealthStatus {
    return value <= critical ? "CRITICAL" : value <= warning ? "WARNING" : "NOMINAL";
  },
};
