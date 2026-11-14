import type { BodyZone } from "../../domain/value-objects/body-zone.vo";

export interface TrendPointDto {
  t: string; // ISO timestamp
  value: number;
}

export interface TrendSeriesDto {
  key: string;
  label: string;
  unit: string;
  warning?: number;
  critical?: number;
  points: TrendPointDto[];
}

export interface VitalHistoryDto {
  astronautId: string;
  zone: BodyZone;
  series: TrendSeriesDto[];
}
