import type { EclssReading } from "../../../domain/models/eclss-reading.model";
import type { MedkitItem } from "../../../domain/models/medkit-item.model";

export interface MissionOpsRepositoryPort {
  findMedkitItems(): Promise<MedkitItem[]>;
  findEclssReadings(): Promise<EclssReading[]>;
}
