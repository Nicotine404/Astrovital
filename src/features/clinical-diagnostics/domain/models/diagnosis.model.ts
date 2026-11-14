import { DomainError } from "@/features/health-monitoring/domain/errors/domain.error";
import { HealthStatus } from "@/features/health-monitoring/domain/value-objects/health-status.vo";

export interface DiagnosticEvidence {
  readonly label: string;
  readonly value: string;
}

export interface DifferentialDiagnosis {
  readonly label: string;
  /** Posterior probability, 0–100. */
  readonly probability: number;
}

/** A diagnostic hypothesis produced on-device for one astronaut. Requires flight-surgeon validation. */
export interface Diagnosis {
  readonly id: string;
  readonly astronautId: string;
  readonly title: string;
  readonly status: HealthStatus;
  readonly probability: number;
  readonly summary: string;
  readonly evidence: readonly DiagnosticEvidence[];
  readonly recommendation: string;
  readonly differentials: readonly DifferentialDiagnosis[];
}

export function createDiagnosis(input: Diagnosis): Diagnosis {
  if (!HealthStatus.isValid(input.status)) throw new DomainError(`Estado clínico desconocido: ${input.status}`);
  const inRange = (p: number) => Number.isFinite(p) && p >= 0 && p <= 100;
  if (!inRange(input.probability)) throw new DomainError("La probabilidad diagnóstica debe estar entre 0 y 100");
  if (input.differentials.some((d) => !inRange(d.probability))) throw new DomainError("Probabilidad diferencial fuera de rango");
  return {
    ...input,
    // Most likely differential first, as clinicians expect to read them.
    differentials: [...input.differentials].sort((a, b) => b.probability - a.probability),
  };
}

/** Primary hypothesis first: worst status, then highest probability. */
export function rankDiagnoses(list: readonly Diagnosis[]): Diagnosis[] {
  return [...list].sort((a, b) => HealthStatus.rank(b.status) - HealthStatus.rank(a.status) || b.probability - a.probability);
}
