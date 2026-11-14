import { createClinicalFile, type ClinicalFile, type ClinicalFileKind } from "../../../domain/models/clinical-file.model";
import { createDiagnosis, type Diagnosis, type DiagnosticEvidence, type DifferentialDiagnosis } from "../../../domain/models/diagnosis.model";
import type { HealthStatus } from "@/features/health-monitoring/domain/value-objects/health-status.vo";

export interface DiagnosisRow {
  id: string;
  astronaut_id: string;
  title: string;
  status: string;
  probability: number;
  summary: string;
  evidence: DiagnosticEvidence[];
  recommendation: string;
  differentials: DifferentialDiagnosis[];
}

export interface ClinicalFileRow {
  id: string;
  astronaut_id: string;
  name: string;
  kind: string;
  size_mb: number;
  captured_at: string;
  findings: string;
  confidence: number;
  model: string;
  latency_ms: number;
}

/** The only place where snake_case rows become camelCase domain objects for this context. */
export const DiagnosticsMapper = {
  diagnosisToDomain: (r: DiagnosisRow): Diagnosis =>
    createDiagnosis({
      id: r.id,
      astronautId: r.astronaut_id,
      title: r.title,
      status: r.status as HealthStatus,
      probability: Number(r.probability),
      summary: r.summary,
      evidence: r.evidence ?? [],
      recommendation: r.recommendation,
      differentials: (r.differentials ?? []).map((d) => ({ label: d.label, probability: Number(d.probability) })),
    }),

  fileToDomain: (r: ClinicalFileRow): ClinicalFile =>
    createClinicalFile({
      id: r.id,
      astronautId: r.astronaut_id,
      name: r.name,
      kind: r.kind as ClinicalFileKind,
      sizeMb: Number(r.size_mb),
      capturedAt: new Date(r.captured_at),
      findings: r.findings,
      confidence: Number(r.confidence),
      model: r.model,
      latencyMs: Number(r.latency_ms),
    }),

  fileToRow: (f: ClinicalFile): ClinicalFileRow => ({
    id: f.id,
    astronaut_id: f.astronautId,
    name: f.name,
    kind: f.kind,
    size_mb: f.sizeMb,
    captured_at: f.capturedAt.toISOString(),
    findings: f.findings,
    confidence: f.confidence,
    model: f.model,
    latency_ms: f.latencyMs,
  }),
};
