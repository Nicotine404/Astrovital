import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClinicalFile } from "../../domain/models/clinical-file.model";
import type { Diagnosis } from "../../domain/models/diagnosis.model";
import type { DiagnosticsRepositoryPort } from "../../application/ports/out/diagnostics-repository.port";
import { DiagnosticsMapper, type ClinicalFileRow, type DiagnosisRow } from "./mappers/diagnostics.mapper";

export class SupabaseDiagnosticsAdapter implements DiagnosticsRepositoryPort {
  constructor(private readonly db: SupabaseClient) {}

  async findDiagnoses(astronautId: string): Promise<Diagnosis[]> {
    const { data, error } = await this.db.from("diagnoses").select("*").eq("astronaut_id", astronautId);
    if (error) throw new Error(`Supabase (diagnoses): ${error.message}`);
    return (data as DiagnosisRow[]).map(DiagnosticsMapper.diagnosisToDomain);
  }

  async findClinicalFiles(astronautId: string): Promise<ClinicalFile[]> {
    const { data, error } = await this.db.from("clinical_files").select("*").eq("astronaut_id", astronautId).order("captured_at", { ascending: false });
    if (error) throw new Error(`Supabase (clinical_files): ${error.message}`);
    return (data as ClinicalFileRow[]).map(DiagnosticsMapper.fileToDomain);
  }

  async saveClinicalFile(file: ClinicalFile): Promise<void> {
    const { error } = await this.db.from("clinical_files").upsert(DiagnosticsMapper.fileToRow(file));
    if (error) throw new Error(`Supabase (clinical_files): ${error.message}`);
  }
}
