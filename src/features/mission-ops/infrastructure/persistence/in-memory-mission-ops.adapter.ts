import type { EclssReading } from "../../domain/models/eclss-reading.model";
import type { MedkitItem } from "../../domain/models/medkit-item.model";
import type { MissionOpsRepositoryPort } from "../../application/ports/out/mission-ops-repository.port";
import { MissionOpsMapper, type EclssReadingRow, type MedkitItemRow } from "./mappers/mission-ops.mapper";
import seed from "./seed/mission-ops.seed.json";

export class InMemoryMissionOpsAdapter implements MissionOpsRepositoryPort {
  async findMedkitItems(): Promise<MedkitItem[]> {
    return (seed.medkit_items as MedkitItemRow[]).map(MissionOpsMapper.medkitToDomain);
  }

  async findEclssReadings(): Promise<EclssReading[]> {
    return (seed.eclss_readings as EclssReadingRow[]).map(MissionOpsMapper.eclssToDomain);
  }
}
