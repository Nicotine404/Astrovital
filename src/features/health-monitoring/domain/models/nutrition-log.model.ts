import { DomainError } from "../errors/domain.error";

/** Daily nutrition intake (RF-06). */
export interface NutritionLog {
  date: string; // YYYY-MM-DD
  caloriesKcal: number;
  waterMl: number;
  calciumMg: number;
  vitaminDIu: number;
}

export interface NutritionIntake {
  caloriesKcal?: number;
  waterMl?: number;
  calciumMg?: number;
  vitaminDIu?: number;
}

/** Adds an intake entry to the day's log (pure). */
export function addIntake(log: NutritionLog, intake: NutritionIntake): NutritionLog {
  const values = Object.values(intake).filter((v): v is number => v !== undefined);
  if (values.some((v) => !Number.isFinite(v) || v < 0)) throw new DomainError("La ingesta no puede ser negativa", "INVALID_INTAKE");
  return {
    ...log,
    caloriesKcal: log.caloriesKcal + (intake.caloriesKcal ?? 0),
    waterMl: log.waterMl + (intake.waterMl ?? 0),
    calciumMg: log.calciumMg + (intake.calciumMg ?? 0),
    vitaminDIu: log.vitaminDIu + (intake.vitaminDIu ?? 0),
  };
}

export const emptyNutritionLog = (date: string): NutritionLog => ({ date, caloriesKcal: 0, waterMl: 0, calciumMg: 0, vitaminDIu: 0 });
