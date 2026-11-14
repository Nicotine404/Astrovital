import type { ClinicalFile } from "../../../domain/models/clinical-file.model";
import type { Diagnosis } from "../../../domain/models/diagnosis.model";

export interface DiagnosticsRepositoryPort {
  findDiagnoses(astronautId: string): Promise<Diagnosis[]>;
  findClinicalFiles(astronautId: string): Promise<ClinicalFile[]>;
  saveClinicalFile(file: ClinicalFile): Promise<void>;
}
