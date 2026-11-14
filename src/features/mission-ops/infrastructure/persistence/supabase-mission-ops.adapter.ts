import type { SupabaseClient } from "@supabase/supabase-js";
import type { EclssReading } from "../../domain/models/eclss-reading.model";
import type { MedkitItem } from "../../domain/models/medkit-item.model";
import type { MissionOpsRepositoryPort } from "../../application/ports/out/mission-ops-repository.port";
import { MissionOpsMapper, type EclssReadingRow, type MedkitItemRow } from "./mappers/mission-ops.mapper";

export class SupabaseMissionOpsAdapter implements MissionOpsRepositoryPort {
  constructor(private readonly db: SupabaseClient) {}

  async findMedkitItems(): Promise<MedkitItem[]> {
    const { data, error } = await this.db.from("medkit_items").select("*").order("locker");
    if (error) throw new Error(`Supabase (medkit_items): ${error.message}`);
    return (data as MedkitItemRow[]).map(MissionOpsMapper.medkitToDomain);
  }

  async findEclssReadings(): Promise<EclssReading[]> {
    const { data, error } = await this.db.from("eclss_readings").select("*").order("sort_order");
    if (error) throw new Error(`Supabase (eclss_readings): ${error.message}`);
    return (data as EclssReadingRow[]).map(MissionOpsMapper.eclssToDomain);
  }
}
