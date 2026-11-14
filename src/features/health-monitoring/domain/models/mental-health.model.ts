import { DomainError } from "../errors/domain.error";

/** Daily psychological check-in (RF-05). */
export interface MentalCheckin {
  recordedAt: string;
  sleepHours: number; // 0..14
  stressLevel: number; // 1 (calm) .. 10 (extreme)
  mood: number; // 1 (very low) .. 10 (excellent)
  notes?: string;
}

export function createMentalCheckin(input: MentalCheckin): MentalCheckin {
  if (input.sleepHours < 0 || input.sleepHours > 14) throw new DomainError("Horas de sueño fuera de rango", "INVALID_CHECKIN");
  for (const [k, v] of [["stressLevel", input.stressLevel], ["mood", input.mood]] as const) {
    if (!Number.isInteger(v) || v < 1 || v > 10) throw new DomainError(`${k} debe ser un entero entre 1 y 10`, "INVALID_CHECKIN");
  }
  return { ...input, notes: input.notes?.slice(0, 500) };
}
