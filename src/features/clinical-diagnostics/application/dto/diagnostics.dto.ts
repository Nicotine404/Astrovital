import { z } from "zod";
import { MAX_CLINICAL_FILE_MB, type ClinicalFile, type ClinicalFileKind } from "../../domain/models/clinical-file.model";
import type { Diagnosis } from "../../domain/models/diagnosis.model";

export const AnalyzeClinicalFileSchema = z.object({
  astronautId: z.string().min(1),
  fileName: z.string().trim().min(1).max(200),
  sizeBytes: z.number().int().nonnegative().max(MAX_CLINICAL_FILE_MB * 1024 * 1024, `Máximo ${MAX_CLINICAL_FILE_MB} MB`),
});
export type AnalyzeClinicalFileInput = z.infer<typeof AnalyzeClinicalFileSchema>;

export interface ClinicalFileDto {
  id: string;
  astronautId: string;
  name: string;
  kind: ClinicalFileKind;
  sizeMb: number;
  capturedAt: string;
  findings: string;
  confidence: number;
  model: string;
  latencyMs: number;
}

export type DiagnosisDto = Diagnosis;

export interface DiagnosticsDto {
  astronautId: string;
  diagnoses: DiagnosisDto[];
  files: ClinicalFileDto[];
}

export const toClinicalFileDto = (f: ClinicalFile): ClinicalFileDto => ({ ...f, capturedAt: f.capturedAt.toISOString() });
