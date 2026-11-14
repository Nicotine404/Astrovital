import { HealthStatus } from "@/features/health-monitoring/domain/value-objects/health-status.vo";
import type { EclssReading } from "../models/eclss-reading.model";
import type { MedkitItem } from "../models/medkit-item.model";

/** Restock thresholds as a share of locker capacity. */
export const STOCK_THRESHOLDS = { warning: 0.35, critical: 0.15 } as const;

/** Share of the nominal band a reading may drift outside before it is critical. */
export const ECLSS_CRITICAL_MARGIN = 0.25;

export const MissionOpsRules = {
  stockRatio: (item: MedkitItem) => item.stock / item.capacity,

  stockStatus(item: MedkitItem): HealthStatus {
    return HealthStatus.below(item.stock / item.capacity, STOCK_THRESHOLDS.warning - 1e-9, STOCK_THRESHOLDS.critical - 1e-9);
  },

  eclssStatus(r: EclssReading): HealthStatus {
    if (r.value >= r.nominalLow && r.value <= r.nominalHigh) return HealthStatus.NOMINAL;
    const span = Math.max(r.nominalHigh - r.nominalLow, Number.EPSILON);
    const off = r.value < r.nominalLow ? r.nominalLow - r.value : r.value - r.nominalHigh;
    return off > span * ECLSS_CRITICAL_MARGIN ? HealthStatus.CRITICAL : HealthStatus.WARNING;
  },
};
