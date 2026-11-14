import { DomainError } from "@/features/health-monitoring/domain/errors/domain.error";
import type { AnatomicalStructureId } from "@/features/health-monitoring/domain/value-objects/anatomical-structure.vo";

export const CLINICAL_FILE_KINDS = ["pdf", "audio", "video", "dicom"] as const;
export type ClinicalFileKind = (typeof CLINICAL_FILE_KINDS)[number];

const EXTENSIONS: Record<Exclude<ClinicalFileKind, "pdf">, readonly string[]> = {
  audio: ["mp3", "wav", "aac", "ogg", "m4a"],
  video: ["mp4", "webm", "mov"],
  dicom: ["dcm", "dicom", "raw", "png", "jpg", "jpeg"],
};

/** Modality inferred from the file extension; anything unrecognised is treated as a document. */
export function kindFromFileName(name: string): ClinicalFileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  for (const kind of ["audio", "video", "dicom"] as const) if (EXTENSIONS[kind].includes(ext)) return kind;
  return "pdf";
}

/** Analysis pipeline per modality: the stages the on-device model runs and the structure it reports on. */
export const ANALYSIS_PIPELINES: Record<ClinicalFileKind, { label: string; stages: readonly string[]; structure: AnatomicalStructureId }> = {
  pdf: { label: "Documento", structure: "heart", stages: ["Extrayendo texto (OCR)", "Segmentando 12 derivaciones", "Correlacionando con telemetría"] },
  audio: { label: "Audio", structure: "heart", stages: ["Transformada espectral (FFT)", "Clasificando ruidos cardíacos", "Correlacionando con ECG"] },
  video: { label: "Vídeo", structure: "heart", stages: ["Decodificando fotogramas", "Segmentando bordes endocárdicos", "Calculando FEVI"] },
  dicom: { label: "DICOM", structure: "eyes", stages: ["Reconstrucción volumétrica", "Midiendo capa de fibras nerviosas", "Estimando PIC"] },
};

export const MAX_CLINICAL_FILE_MB = 512;

export interface ClinicalFile {
  readonly id: string;
  readonly astronautId: string;
  readonly name: string;
  readonly kind: ClinicalFileKind;
  readonly sizeMb: number;
  readonly capturedAt: Date;
  readonly findings: string;
  /** Model confidence, 0–100. */
  readonly confidence: number;
  readonly model: string;
  readonly latencyMs: number;
}

export function createClinicalFile(input: ClinicalFile): ClinicalFile {
  if (!input.name.trim()) throw new DomainError("El archivo clínico necesita un nombre");
  if (!(input.sizeMb >= 0) || input.sizeMb > MAX_CLINICAL_FILE_MB) {
    throw new DomainError(`El archivo supera el máximo de ${MAX_CLINICAL_FILE_MB} MB para análisis local`);
  }
  if (!(input.confidence >= 0 && input.confidence <= 100)) throw new DomainError("Confianza fuera de rango");
  return input;
}
