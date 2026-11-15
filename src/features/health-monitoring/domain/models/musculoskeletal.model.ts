import { DomainError } from "../errors/domain.error";

/** Self-reported symptom intensity: 0 none · 1 mild · 2 moderate · 3 severe. */
export type SymptomSeverity = 0 | 1 | 2 | 3;
export const SYMPTOM_SEVERITY_LABELS = ["Ninguno", "Leve", "Moderado", "Severo"] as const;

/** Bone, muscle and fluid-shift state (RF-04 / CU-05). */
export interface Musculoskeletal {
  /** Bone mineral density change since launch, % (negative = loss). */
  boneDensityDeltaPct: number;
  muscleMassDeltaPct: number;
  /** Measured cephalad fluid shift, mmHg (head-to-foot pressure delta vs. Earth baseline). */
  cephalicFluidShiftMmHg: number;
  /** Measured spinal elongation since launch, cm. */
  spinalElongationCm: number;
  exerciseMinutesToday: number;
  exerciseTargetMinutes: number;
  /** Blurred or reduced vision (fluid shift / SANS). */
  visionSymptom: SymptomSeverity;
  /** Dizziness or loss of balance (vestibular adaptation, orthostatic intolerance). */
  dizzinessSymptom: SymptomSeverity;
  symptomsRecordedAt: string | null;
}

const isSeverity = (v: number): v is SymptomSeverity => Number.isInteger(v) && v >= 0 && v <= 3;

/** Adds a completed countermeasure session (pure). */
export function addExercise(m: Musculoskeletal, minutes: number): Musculoskeletal {
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 240) throw new DomainError("Duración de ejercicio fuera de rango", "INVALID_EXERCISE");
  return { ...m, exerciseMinutesToday: Math.min(600, m.exerciseMinutesToday + Math.round(minutes)) };
}

/** Replaces the latest symptom self-report (pure). */
export function reportSymptoms(m: Musculoskeletal, vision: number, dizziness: number, recordedAt: string): Musculoskeletal {
  if (!isSeverity(vision) || !isSeverity(dizziness)) throw new DomainError("La intensidad del síntoma debe ser 0, 1, 2 o 3", "INVALID_SYMPTOM");
  return { ...m, visionSymptom: vision, dizzinessSymptom: dizziness, symptomsRecordedAt: recordedAt };
}
