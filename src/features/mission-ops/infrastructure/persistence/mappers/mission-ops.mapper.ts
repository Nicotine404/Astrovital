import { createEclssReading, type EclssReading } from "../../../domain/models/eclss-reading.model";
import { createMedkitItem, type MedkitItem } from "../../../domain/models/medkit-item.model";

export interface MedkitItemRow {
  id: string;
  locker: string;
  name: string;
  category: string;
  stock: number;
  capacity: number;
  unit: string;
  expires: string;
  note: string | null;
}

export interface EclssReadingRow {
  id: string;
  label: string;
  value: number;
  unit: string;
  min_value: number;
  max_value: number;
  nominal_low: number;
  nominal_high: number;
  note: string | null;
  history: number[];
}

export const MissionOpsMapper = {
  medkitToDomain: (r: MedkitItemRow): MedkitItem =>
    createMedkitItem({ ...r, stock: Number(r.stock), capacity: Number(r.capacity), note: r.note ?? "" }),

  eclssToDomain: (r: EclssReadingRow): EclssReading =>
    createEclssReading({
      id: r.id,
      label: r.label,
      value: Number(r.value),
      unit: r.unit,
      min: Number(r.min_value),
      max: Number(r.max_value),
      nominalLow: Number(r.nominal_low),
      nominalHigh: Number(r.nominal_high),
      note: r.note ?? "",
      history: (r.history ?? []).map(Number),
    }),
};
