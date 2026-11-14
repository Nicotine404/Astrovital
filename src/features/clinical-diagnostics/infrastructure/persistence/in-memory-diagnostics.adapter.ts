import type { ClinicalFile } from "../../domain/models/clinical-file.model";
import type { Diagnosis } from "../../domain/models/diagnosis.model";
import type { DiagnosticsRepositoryPort } from "../../application/ports/out/diagnostics-repository.port";
import type { ClockPort } from "@/features/health-monitoring/application/ports/out/clock.port";
import { DiagnosticsMapper } from "./mappers/diagnostics.mapper";
import { buildDiagnosticsSeed, type DiagnosticsTables } from "./seed/diagnostics.seed";

const STORE_KEY = "__astrovital_diagnostics_tables__";
const store = globalThis as unknown as Record<string, DiagnosticsTables | undefined>;

/** DiagnosticsRepositoryPort over in-process snake_case tables; used when Supabase is not configured. */
export class InMemoryDiagnosticsAdapter implements DiagnosticsRepositoryPort {
  constructor(private readonly clock: ClockPort) {}

  private get tables(): DiagnosticsTables {
    return (store[STORE_KEY] ??= buildDiagnosticsSeed(this.clock.now()));
  }

  async findDiagnoses(astronautId: string): Promise<Diagnosis[]> {
    return this.tables.diagnoses.filter((r) => r.astronaut_id === astronautId).map(DiagnosticsMapper.diagnosisToDomain);
  }

  async findClinicalFiles(astronautId: string): Promise<ClinicalFile[]> {
    return this.tables.clinical_files.filter((r) => r.astronaut_id === astronautId).map(DiagnosticsMapper.fileToDomain);
  }

  async saveClinicalFile(file: ClinicalFile): Promise<void> {
    const row = DiagnosticsMapper.fileToRow(file);
    const list = this.tables.clinical_files;
    const i = list.findIndex((r) => r.id === row.id);
    if (i >= 0) list[i] = row;
    else list.push(row);
  }
}
