import type { AnatomicalStructureId } from "../value-objects/anatomical-structure.vo";
import type { HealthStatus } from "../value-objects/health-status.vo";

export interface AssessmentMetric {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}

/** Clinical assessment of one anatomical structure. */
export interface OrganAssessment {
  structureId: AnatomicalStructureId;
  /** Finding recorded by the clinician / diagnostic AI. */
  clinicalStatus: HealthStatus;
  /** Effective status after applying gravity-dependent clinical rules (never better than clinicalStatus). */
  status: HealthStatus;
  title: string;
  summary: string;
  metrics: AssessmentMetric[];
  recommendedAction: string;
}
