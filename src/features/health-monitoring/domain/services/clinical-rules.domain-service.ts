import type { AstronautTelemetry } from "../models/astronaut-telemetry.model";
import type { MentalCheckin } from "../models/mental-health.model";
import type { Musculoskeletal } from "../models/musculoskeletal.model";
import type { NutritionLog } from "../models/nutrition-log.model";
import type { OrganAssessment } from "../models/organ-assessment.model";
import { latestReading, type RadiationDosimetry } from "../models/radiation-dosimetry.model";
import type { VitalSigns } from "../models/vital-signs.model";
import type { AnatomicalStructureId } from "../value-objects/anatomical-structure.vo";
import { STRUCTURES } from "../value-objects/anatomical-structure.vo";
import type { BodyZone } from "../value-objects/body-zone.vo";
import type { GravityEnvironment } from "../value-objects/gravity-environment.vo";
import { HealthStatus } from "../value-objects/health-status.vo";

/* ------------------------------------------------------------------ */
/* Thresholds                                                          */
/* ------------------------------------------------------------------ */
export interface ClinicalThresholds {
  systolicWarning: number;
  systolicCritical: number;
  icpWarning: number;
  icpCritical: number;
  /** Expected bone mineral loss per month at this gravity, %. */
  boneLossPerMonthPct: number;
  boneWarningPct: number;
  boneCriticalPct: number;
  expectedFluidShiftMmHg: number;
  fluidShiftToleranceMmHg: number;
  expectedSpinalElongationCm: number;
}

export const NUTRITION_TARGETS = { caloriesKcal: 2500, waterMl: 2500, calciumMg: 1000, vitaminDIu: 800 } as const;
export const NUTRITION_UPPER_LIMITS = { calciumMg: 2000, vitaminDIu: 4000 } as const;
export const CAREER_DOSE_LIMIT_MSV = 600;
/** Dosimetry action levels: dose rate (mSv/day), CANS neutron flux (n·cm⁻²·s⁻¹) and career fraction. */
export const RADIATION_LIMITS = {
  doseRate: { warning: 1.0, critical: 5.0 },
  neutronFlux: { warning: 2.5, critical: 8 },
  careerFraction: { warning: 0.5, critical: 0.8 },
} as const;

/* ------------------------------------------------------------------ */
/* Evaluation results                                                  */
/* ------------------------------------------------------------------ */
export interface VitalsEvaluation {
  heartRate: HealthStatus;
  bloodPressure: HealthStatus;
  spo2: HealthStatus;
  respiratoryRate: HealthStatus;
  temperature: HealthStatus;
  glucose: HealthStatus;
  intracranialPressure: HealthStatus;
  overall: HealthStatus;
}

export interface MusculoskeletalEvaluation {
  boneDensity: HealthStatus;
  projectedBoneDeltaPct: number;
  fluidShift: HealthStatus;
  exercise: HealthStatus;
  exerciseCompliancePct: number;
  overall: HealthStatus;
}

export interface RadiationEvaluation {
  cumulative: HealthStatus;
  doseRate: HealthStatus;
  neutronFlux: HealthStatus;
  careerFraction: number;
  shelterRequired: boolean;
  overall: HealthStatus;
}

export interface MentalEvaluation {
  sleep: HealthStatus;
  stress: HealthStatus;
  mood: HealthStatus;
  overall: HealthStatus;
}

export interface NutritionEvaluation {
  progress: Record<keyof typeof NUTRITION_TARGETS, number>; // fraction of daily target
  statuses: Record<keyof typeof NUTRITION_TARGETS, HealthStatus>;
  overall: HealthStatus;
  alerts: string[];
}

export interface ClinicalAlert {
  severity: Exclude<HealthStatus, "NOMINAL">;
  zone: BodyZone | "RADIATION" | "WELLBEING" | "NUTRITION";
  message: string;
}

export interface TelemetryEvaluation {
  vitals: VitalsEvaluation;
  musculoskeletal: MusculoskeletalEvaluation;
  radiation: RadiationEvaluation;
  mental: MentalEvaluation;
  nutrition: NutritionEvaluation;
  zones: Record<BodyZone, HealthStatus>;
  overall: HealthStatus;
  healthIndex: number;
  alerts: ClinicalAlert[];
}

/**
 * Pure clinical rules. Every gravity-dependent limit lives here so the rest of the
 * system never hard-codes medical thresholds.
 */
export class ClinicalRulesService {
  thresholdsFor(env: GravityEnvironment): ClinicalThresholds {
    const u = env.unloading;
    const systolicWarning = Math.round(140 - 10 * u); // cephalad shift raises upper-body pressure: flag earlier
    const icpWarning = round1(15 + 5 * env.g); // SANS risk grows as gravity drops
    return {
      systolicWarning,
      systolicCritical: systolicWarning + 20,
      icpWarning,
      icpCritical: round1(icpWarning + 4),
      boneLossPerMonthPct: round2(1.5 * u),
      boneWarningPct: -1.5,
      boneCriticalPct: -3,
      expectedFluidShiftMmHg: Math.round(24 * u),
      fluidShiftToleranceMmHg: 6,
      expectedSpinalElongationCm: round1(4.5 * u),
    };
  }

  evaluateVitals(v: VitalSigns, env: GravityEnvironment): VitalsEvaluation {
    const t = this.thresholdsFor(env);
    const heartRate = HealthStatus.worst(HealthStatus.above(v.heartRate, 100, 120), HealthStatus.below(v.heartRate, 45, 38));
    const bloodPressure = HealthStatus.worst(
      HealthStatus.above(v.systolic, t.systolicWarning, t.systolicCritical),
      HealthStatus.below(v.systolic, 90, 80),
      HealthStatus.above(v.diastolic, 90, 110)
    );
    const spo2 = HealthStatus.below(v.spo2, 94.9, 89.9);
    const respiratoryRate = HealthStatus.worst(HealthStatus.above(v.respiratoryRate, 24, 30), HealthStatus.below(v.respiratoryRate, 9, 6));
    const temperature = HealthStatus.worst(HealthStatus.above(v.coreTemperature, 37.8, 39), HealthStatus.below(v.coreTemperature, 35.5, 35));
    const glucose = HealthStatus.worst(HealthStatus.above(v.glucose, 140, 250), HealthStatus.below(v.glucose, 70, 54));
    const intracranialPressure = HealthStatus.above(v.intracranialPressure, t.icpWarning, t.icpCritical);
    return {
      heartRate,
      bloodPressure,
      spo2,
      respiratoryRate,
      temperature,
      glucose,
      intracranialPressure,
      overall: HealthStatus.worst(heartRate, bloodPressure, spo2, respiratoryRate, temperature, glucose, intracranialPressure),
    };
  }

  evaluateMusculoskeletal(m: Musculoskeletal, env: GravityEnvironment, dayFraction: number): MusculoskeletalEvaluation {
    const t = this.thresholdsFor(env);
    const projected = round2(m.boneDensityDeltaPct - t.boneLossPerMonthPct);
    const boneDensity = HealthStatus.below(projected, t.boneWarningPct, t.boneCriticalPct);
    const deviation = Math.abs(m.cephalicFluidShiftMmHg - t.expectedFluidShiftMmHg);
    const fluidShift = HealthStatus.above(deviation, t.fluidShiftToleranceMmHg + 0.01, t.fluidShiftToleranceMmHg * 2);
    const expectedMinutes = m.exerciseTargetMinutes * clamp(dayFraction, 0, 1);
    const compliance = m.exerciseTargetMinutes > 0 ? m.exerciseMinutesToday / m.exerciseTargetMinutes : 1;
    const paceRatio = expectedMinutes > 0 ? m.exerciseMinutesToday / expectedMinutes : 1;
    // Exercise is the main countermeasure; missing it matters more when unloading is higher.
    const exercise = env.unloading > 0 ? HealthStatus.below(paceRatio, 0.6, 0.25) : "NOMINAL";
    return {
      boneDensity,
      projectedBoneDeltaPct: projected,
      fluidShift,
      exercise,
      exerciseCompliancePct: Math.round(compliance * 100),
      overall: HealthStatus.worst(boneDensity, fluidShift, exercise),
    };
  }

  evaluateRadiation(d: RadiationDosimetry): RadiationEvaluation {
    const last = latestReading(d);
    const careerFraction = d.cumulativeMsv / (d.careerLimitMsv || CAREER_DOSE_LIMIT_MSV);
    const L = RADIATION_LIMITS;
    const cumulative = HealthStatus.above(careerFraction, L.careerFraction.warning, L.careerFraction.critical);
    const doseRate = last ? HealthStatus.above(last.doseRateMsvDay, L.doseRate.warning, L.doseRate.critical) : "NOMINAL";
    const neutronFlux = last ? HealthStatus.above(last.neutronFlux, L.neutronFlux.warning, L.neutronFlux.critical) : "NOMINAL";
    const shelterRequired = doseRate === "CRITICAL" || neutronFlux === "CRITICAL" || (last?.source === "SPE" && doseRate !== "NOMINAL");
    return {
      cumulative,
      doseRate,
      neutronFlux,
      careerFraction: round2(careerFraction),
      shelterRequired,
      overall: shelterRequired ? "CRITICAL" : HealthStatus.worst(cumulative, doseRate, neutronFlux),
    };
  }

  evaluateMental(c: MentalCheckin | undefined): MentalEvaluation {
    if (!c) return { sleep: "NOMINAL", stress: "NOMINAL", mood: "NOMINAL", overall: "NOMINAL" };
    const sleep = HealthStatus.below(c.sleepHours, 5.99, 4.5);
    const stress = HealthStatus.above(c.stressLevel, 7, 9);
    const mood = HealthStatus.below(c.mood, 4, 2);
    return { sleep, stress, mood, overall: HealthStatus.worst(sleep, stress, mood) };
  }

  /** dayFraction: share of the waking day already elapsed (0..1), so intake is judged against pace. */
  evaluateNutrition(log: NutritionLog, dayFraction: number): NutritionEvaluation {
    const keys = Object.keys(NUTRITION_TARGETS) as (keyof typeof NUTRITION_TARGETS)[];
    const progress = {} as NutritionEvaluation["progress"];
    const statuses = {} as NutritionEvaluation["statuses"];
    const alerts: string[] = [];
    const pace = clamp(dayFraction, 0.1, 1);
    for (const k of keys) {
      const p = log[k] / NUTRITION_TARGETS[k];
      progress[k] = round2(p);
      statuses[k] = HealthStatus.below(p / pace, 0.6, 0.3);
    }
    if (log.calciumMg > NUTRITION_UPPER_LIMITS.calciumMg) {
      statuses.calciumMg = "WARNING";
      alerts.push("Calcio por encima del límite superior: riesgo de litiasis renal.");
    }
    if (log.vitaminDIu > NUTRITION_UPPER_LIMITS.vitaminDIu) {
      statuses.vitaminDIu = "WARNING";
      alerts.push("Vitamina D por encima del límite superior tolerable.");
    }
    if (statuses.calciumMg !== "NOMINAL" || statuses.vitaminDIu !== "NOMINAL") {
      if (log.calciumMg <= NUTRITION_UPPER_LIMITS.calciumMg) alerts.push("Aporte de calcio/vitamina D bajo: acelera la pérdida ósea en gravedad reducida.");
    }
    if (statuses.waterMl !== "NOMINAL") alerts.push("Hidratación insuficiente para el ritmo del día.");
    if (statuses.caloriesKcal !== "NOMINAL") alerts.push("Ingesta calórica por debajo del ritmo previsto.");
    return { progress, statuses, overall: HealthStatus.worst(...keys.map((k) => statuses[k])), alerts };
  }

  /** Effective structure status: clinician finding, escalated by gravity-dependent rules. */
  recalibrateAssessments(t: AstronautTelemetry, env: GravityEnvironment, dayFraction: number): OrganAssessment[] {
    const vitals = this.evaluateVitals(t.vitals, env);
    const msk = this.evaluateMusculoskeletal(t.musculoskeletal, env, dayFraction);
    const ruleStatus: Partial<Record<AnatomicalStructureId, HealthStatus>> = {
      brain: vitals.intracranialPressure,
      eyes: vitals.intracranialPressure,
      heart: HealthStatus.worst(vitals.heartRate, vitals.bloodPressure),
      vessels: HealthStatus.worst(vitals.bloodPressure, msk.fluidShift),
      lungs: HealthStatus.worst(vitals.spo2, vitals.respiratoryRate),
      pancreas: vitals.glucose,
      femur: msk.boneDensity,
      pelvis: msk.boneDensity,
      tibia: msk.boneDensity,
      calcaneus: HealthStatus.worst(msk.boneDensity, msk.fluidShift),
    };
    return t.assessments.map((a) => ({ ...a, status: HealthStatus.worst(a.clinicalStatus, ruleStatus[a.structureId] ?? "NOMINAL") }));
  }

  evaluate(t: AstronautTelemetry, env: GravityEnvironment, dayFraction: number): TelemetryEvaluation {
    const vitals = this.evaluateVitals(t.vitals, env);
    const musculoskeletal = this.evaluateMusculoskeletal(t.musculoskeletal, env, dayFraction);
    const radiation = this.evaluateRadiation(t.radiation);
    const mental = this.evaluateMental(t.latestCheckin);
    const nutrition = this.evaluateNutrition(t.nutrition, dayFraction);
    const assessments = this.recalibrateAssessments(t, env, dayFraction);

    const zones = { CARDIO: "NOMINAL", NEURO: "NOMINAL", IMMUNE: "NOMINAL", MUSCULOSKELETAL: "NOMINAL" } as Record<BodyZone, HealthStatus>;
    for (const a of assessments) {
      const z = STRUCTURES[a.structureId].zone;
      zones[z] = HealthStatus.worst(zones[z], a.status);
    }
    zones.CARDIO = HealthStatus.worst(zones.CARDIO, vitals.heartRate, vitals.bloodPressure, vitals.spo2);
    zones.NEURO = HealthStatus.worst(zones.NEURO, vitals.intracranialPressure);
    zones.MUSCULOSKELETAL = HealthStatus.worst(zones.MUSCULOSKELETAL, musculoskeletal.overall);
    zones.IMMUNE = HealthStatus.worst(zones.IMMUNE, vitals.glucose, vitals.temperature);

    const alerts: ClinicalAlert[] = [];
    const push = (status: HealthStatus, zone: ClinicalAlert["zone"], message: string) => {
      if (status !== "NOMINAL") alerts.push({ severity: status, zone, message });
    };
    const th = this.thresholdsFor(env);
    push(vitals.intracranialPressure, "NEURO", `PIC ${t.vitals.intracranialPressure} mmHg sobre el umbral de ${th.icpWarning} mmHg para ${env.label}: riesgo de SANS.`);
    push(vitals.bloodPressure, "CARDIO", `Presión arterial ${t.vitals.systolic}/${t.vitals.diastolic} mmHg fuera de rango para ${env.label}.`);
    push(vitals.spo2, "CARDIO", `Saturación de oxígeno baja (${t.vitals.spo2} %).`);
    push(musculoskeletal.boneDensity, "MUSCULOSKELETAL", `Densidad ósea proyectada a 30 días: ${musculoskeletal.projectedBoneDeltaPct} %.`);
    push(musculoskeletal.fluidShift, "MUSCULOSKELETAL", `Desplazamiento de fluidos ${t.musculoskeletal.cephalicFluidShiftMmHg} mmHg frente a ${th.expectedFluidShiftMmHg} mmHg esperados.`);
    push(musculoskeletal.exercise, "MUSCULOSKELETAL", `Ejercicio por debajo del ritmo diario (${musculoskeletal.exerciseCompliancePct} % del objetivo).`);
    if (radiation.shelterRequired) alerts.push({ severity: "CRITICAL", zone: "RADIATION", message: "Evento de partículas: dirigirse al refugio blindado de inmediato." });
    else push(radiation.overall, "RADIATION", `Dosis acumulada al ${Math.round(radiation.careerFraction * 100)} % del límite de carrera.`);
    push(mental.overall, "WELLBEING", "El último check-in psicológico indica sueño, estrés o ánimo fuera de rango.");
    for (const msg of nutrition.alerts) alerts.push({ severity: "WARNING", zone: "NUTRITION", message: msg });

    const statuses = [vitals.overall, musculoskeletal.overall, radiation.overall, mental.overall, nutrition.overall];
    let penalty = 0;
    for (const s of statuses) penalty += s === "CRITICAL" ? 9 : s === "WARNING" ? 3 : 0;
    for (const a of assessments) penalty += a.status === "CRITICAL" ? 5 : a.status === "WARNING" ? 1.5 : 0;

    const overall = HealthStatus.worst(...statuses, ...assessments.map((a) => a.status));
    return {
      vitals,
      musculoskeletal,
      radiation,
      mental,
      nutrition,
      zones,
      overall,
      healthIndex: round1(clamp(100 - penalty, 0, 100)),
      alerts: alerts.sort((a, b) => HealthStatus.rank(b.severity) - HealthStatus.rank(a.severity)),
    };
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;
