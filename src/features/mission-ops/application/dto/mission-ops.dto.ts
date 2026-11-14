import type { HealthStatus } from "@/features/health-monitoring/domain/value-objects/health-status.vo";
import type { EclssReading } from "../../domain/models/eclss-reading.model";
import type { MedkitItem } from "../../domain/models/medkit-item.model";

export interface MedkitItemDto extends MedkitItem {
  status: HealthStatus;
  /** 0–100 */
  fillPct: number;
}

export interface MedkitInventoryDto {
  items: MedkitItemDto[];
  restockCount: number;
}

export interface EclssReadingDto extends EclssReading {
  status: HealthStatus;
}

export interface CabinEnvironmentDto {
  readings: EclssReadingDto[];
  overall: HealthStatus;
}
