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
import type { GravityEnvironment, GravityEnvironmentId } from "../value-objects/gravity-environment.vo";
import type { Habitat } from "../value-objects/habitat.vo";
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
  /** Mandatory daily countermeasure exercise for this gravity (sum of the routine). */
  exerciseTargetMinutes: number;
}

/** One block of the daily countermeasure routine. */
export interface CountermeasureRoutine {
  id: string;
  label: string;
  minutes: number;
  purpose: string;
}

/**
 * Daily countermeasure routine per gravity. Less gravity means more loading has to be replaced by
 * exercise (ISS reference: ~2.5 h/day across ARED, T2 treadmill and CEVIS cycle ergometer).
 */
const COUNTERMEASURES: Record<GravityEnvironmentId, CountermeasureRoutine[]> = {
  ZERO_G: [
    { id: "ared", label: "Resistencia ARED", minutes: 60, purpose: "Carga axial que frena la pérdida ósea y muscular" },
    { id: "treadmill", label: "Cinta T2 con arnés", minutes: 45, purpose: "Impacto en piernas y capacidad aeróbica" },
    { id: "cycle", label: "Cicloergómetro CEVIS", minutes: 45, purpose: "Condición cardiovascular" },
  ],
  LUNAR: [
    { id: "ared", label: "Resistencia ARED", minutes: 50, purpose: "Carga axial que frena la pérdida ósea y muscular" },
    { id: "treadmill", label: "Cinta con arnés", minutes: 40, purpose: "Impacto en piernas y capacidad aeróbica" },
    { id: "cycle", label: "Cicloergómetro", minutes: 30, purpose: "Condición cardiovascular" },
  ],
  MARTIAN: [
    { id: "resistance", label: "Resistencia con carga", minutes: 45, purpose: "Mantener masa ósea y muscular" },
    { id: "run", label: "Carrera en el hábitat", minutes: 30, purpose: "Impacto y capacidad aeróbica" },
    { id: "cycle", label: "Cicloergómetro", minutes: 15, purpose: "Condición cardiovascular" },
  ],
  EARTH: [
    { id: "rehab", label: "Reacondicionamiento post-vuelo", minutes: 30, purpose: "Fuerza y equilibrio tras la readaptación" },
    { id: "walk", label: "Caminata", minutes: 30, purpose: "Tolerancia ortostática" },
  ],
};

export const NUTRITION_TARGETS = { caloriesKcal: 2500, waterMl: 2500, calciumMg: 1000, vitaminDIu: 800, proteinG: 100 } as const;
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
  exerciseTargetMinutes: number;
  routine: CountermeasureRoutine[];
  vision: HealthStatus;
  dizziness: HealthStatus;
  overall: HealthStatus;
}

export interface RadiationEvaluation {
  cumulative: HealthStatus;
  doseRate: HealthStatus;
  neutronFlux: HealthStatus;
  careerFraction: number;
  shelterRequired: boolean;
  /** Radiation depresses the immune system: after an SPE or near the dose limit, run an immune check. */
  immuneCheckRequired: boolean;
  overall: HealthStatus;
}

export interface MentalEvaluation {
  sleep: HealthStatus;
  stress: HealthStatus;
  mood: HealthStatus;
  /** Sustained pattern over consecutive days (what a single check-in cannot show). */
  trend: HealthStatus;
  poorSleepDays: number;
  lowMoodDays: number;
  highStressDays: number;
  alerts: string[];
  overall: HealthStatus;
}

/** Consecutive days needed to flag a pattern (warning / critical). */
export const MENTAL_TREND_DAYS = { warning: 3, critical: 5 } as const;

export interface NutritionEvaluation {
  progress: Record<keyof typeof NUTRITION_TARGETS, number>; // fraction of daily target
  statuses: Record<keyof typeof NUTRITION_TARGETS, HealthStatus>;
  overall: HealthStatus;
  alerts: string[];
}

/**
 * Who has to act on an alert: the astronaut alone, with a crewmate (to confirm, help or
 * treat), or the flight surgeons on Earth (subject to the communication delay).
 */
export type Escalation = "SELF" | "CREW" | "GROUND";

export interface ClinicalAlert {
  severity: Exclude<HealthStatus, "NOMINAL">;
  zone: BodyZone | "RADIATION" | "WELLBEING" | "NUTRITION" | "IMMUNE";
  message: string;
  escalation: Escalation;
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
      exerciseTargetMinutes: this.countermeasuresFor(env).reduce((n, r) => n + r.minutes, 0),
    };
  }

  /** Daily routine; without a resistance device (rovers) resistance work uses bands and body weight. */
  countermeasuresFor(env: GravityEnvironment, habitat?: Habitat): CountermeasureRoutine[] {
    return COUNTERMEASURES[env.id].map((r) =>
      habitat && !habitat.hasResistanceDevice && (r.id === "ared" || r.id === "resistance")
        ? { ...r, label: "Bandas elásticas y peso corporal", purpose: "Sin máquina de resistencia a bordo: carga con bandas y peso corporal" }
        : { ...r }
    );
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

  evaluateMusculoskeletal(m: Musculoskeletal, env: GravityEnvironment, dayFraction: number, habitat?: Habitat): MusculoskeletalEvaluation {
    const t = this.thresholdsFor(env);
    const projected = round2(m.boneDensityDeltaPct - t.boneLossPerMonthPct);
    const boneDensity = HealthStatus.below(projected, t.boneWarningPct, t.boneCriticalPct);
    const deviation = Math.abs(m.cephalicFluidShiftMmHg - t.expectedFluidShiftMmHg);
    const fluidShift = HealthStatus.above(deviation, t.fluidShiftToleranceMmHg + 0.01, t.fluidShiftToleranceMmHg * 2);
    const target = t.exerciseTargetMinutes;
    const expectedMinutes = target * clamp(dayFraction, 0, 1);
    const compliance = target > 0 ? m.exerciseMinutesToday / target : 1;
    const paceRatio = expectedMinutes > 0 ? m.exerciseMinutesToday / expectedMinutes : 1;
    // Exercise is the main countermeasure; missing it matters more when unloading is higher.
    const exercise = env.unloading > 0 ? HealthStatus.below(paceRatio, 0.6, 0.25) : "NOMINAL";
    // Vision changes are the visible face of SANS: any report matters, a strong one with fluid shift is critical.
    const vision: HealthStatus = m.visionSymptom >= 3 || (m.visionSymptom >= 2 && fluidShift !== "NOMINAL") ? "CRITICAL" : m.visionSymptom >= 1 ? "WARNING" : "NOMINAL";
    // Mild dizziness is expected while adapting to a new gravity; moderate or worse is not.
    const dizziness: HealthStatus = m.dizzinessSymptom >= 3 ? "CRITICAL" : m.dizzinessSymptom >= 2 ? "WARNING" : "NOMINAL";
    return {
      boneDensity,
      projectedBoneDeltaPct: projected,
      fluidShift,
      exercise,
      exerciseCompliancePct: Math.round(compliance * 100),
      exerciseTargetMinutes: target,
      routine: this.countermeasuresFor(env, habitat),
      vision,
      dizziness,
      overall: HealthStatus.worst(boneDensity, fluidShift, exercise, vision, dizziness),
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
      immuneCheckRequired: shelterRequired || cumulative === "CRITICAL",
      overall: shelterRequired ? "CRITICAL" : HealthStatus.worst(cumulative, doseRate, neutronFlux),
    };
  }

  /** Latest check-in plus the multi-day pattern (one check-in per day: the last one of each day counts). */
  evaluateMental(history: readonly MentalCheckin[]): MentalEvaluation {
    const days = lastPerDay(history);
    const c = days.at(-1);
    if (!c) return { sleep: "NOMINAL", stress: "NOMINAL", mood: "NOMINAL", trend: "NOMINAL", poorSleepDays: 0, lowMoodDays: 0, highStressDays: 0, alerts: [], overall: "NOMINAL" };
    const sleep = HealthStatus.below(c.sleepHours, 5.99, 4.5);
    const stress = HealthStatus.above(c.stressLevel, 7, 9);
    const mood = HealthStatus.below(c.mood, 4, 2);

    const streak = (bad: (x: MentalCheckin) => boolean) => {
      let n = 0;
      for (let i = days.length - 1; i >= 0 && bad(days[i]); i--) n++;
      return n;
    };
    const poorSleepDays = streak((x) => x.sleepHours < 6);
    const lowMoodDays = streak((x) => x.mood <= 4);
    const highStressDays = streak((x) => x.stressLevel >= 8);
    const { warning, critical } = MENTAL_TREND_DAYS;
    const trend = HealthStatus.worst(
      HealthStatus.above(poorSleepDays, warning, critical),
      HealthStatus.above(lowMoodDays, warning, critical),
      HealthStatus.above(highStressDays, warning, critical)
    );
    const alerts: string[] = [];
    if (poorSleepDays >= warning) alerts.push(`${poorSleepDays} días seguidos durmiendo menos de 6 h: revisar horario de sueño, luz de cabina y ruido.`);
    if (lowMoodDays >= warning) alerts.push(`${lowMoodDays} días seguidos con ánimo bajo: agendar conversación privada con el psicólogo de vuelo.`);
    if (highStressDays >= warning) alerts.push(`${highStressDays} días seguidos con estrés alto: reducir carga de tareas y reservar tiempo personal.`);
    return { sleep, stress, mood, trend, poorSleepDays, lowMoodDays, highStressDays, alerts, overall: HealthStatus.worst(sleep, stress, mood, trend) };
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
    if (statuses.proteinG !== "NOMINAL") alerts.push("Proteína por debajo del ritmo previsto: acelera la pérdida de masa muscular.");
    if (statuses.caloriesKcal !== "NOMINAL") alerts.push("Ingesta calórica por debajo del ritmo previsto.");
    return { progress, statuses, overall: HealthStatus.worst(...keys.map((k) => statuses[k])), alerts };
  }

  /** Effective structure status: clinician finding, escalated by gravity-dependent rules. */
  recalibrateAssessments(t: AstronautTelemetry, env: GravityEnvironment, dayFraction: number): OrganAssessment[] {
    const vitals = this.evaluateVitals(t.vitals, env);
    const msk = this.evaluateMusculoskeletal(t.musculoskeletal, env, dayFraction);
    const ruleStatus: Partial<Record<AnatomicalStructureId, HealthStatus>> = {
      brain: HealthStatus.worst(vitals.intracranialPressure, msk.dizziness),
      eyes: HealthStatus.worst(vitals.intracranialPressure, msk.vision),
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

  evaluate(t: AstronautTelemetry, env: GravityEnvironment, dayFraction: number, habitat?: Habitat): TelemetryEvaluation {
    const vitals = this.evaluateVitals(t.vitals, env);
    const musculoskeletal = this.evaluateMusculoskeletal(t.musculoskeletal, env, dayFraction, habitat);
    const radiation = this.evaluateRadiation(t.radiation);
    const mental = this.evaluateMental(t.mentalCheckins);
    const nutrition = this.evaluateNutrition(t.nutrition, dayFraction);
    const assessments = this.recalibrateAssessments(t, env, dayFraction);

    const zones = { CARDIO: "NOMINAL", NEURO: "NOMINAL", IMMUNE: "NOMINAL", MUSCULOSKELETAL: "NOMINAL" } as Record<BodyZone, HealthStatus>;
    for (const a of assessments) {
      const z = STRUCTURES[a.structureId].zone;
      zones[z] = HealthStatus.worst(zones[z], a.status);
    }
    zones.CARDIO = HealthStatus.worst(zones.CARDIO, vitals.heartRate, vitals.bloodPressure, vitals.spo2);
    zones.NEURO = HealthStatus.worst(zones.NEURO, vitals.intracranialPressure, musculoskeletal.vision, musculoskeletal.dizziness);
    zones.MUSCULOSKELETAL = HealthStatus.worst(zones.MUSCULOSKELETAL, musculoskeletal.overall);
    zones.IMMUNE = HealthStatus.worst(zones.IMMUNE, vitals.glucose, vitals.temperature, radiation.immuneCheckRequired ? "WARNING" : "NOMINAL");

    const alerts: ClinicalAlert[] = [];
    // Default: a warning is self-care; a critical finding needs a crewmate. Some criticals go to Earth.
    const push = (status: HealthStatus, zone: ClinicalAlert["zone"], message: string, criticalTo: Escalation = "CREW") => {
      if (status !== "NOMINAL") alerts.push({ severity: status, zone, message, escalation: status === "CRITICAL" ? criticalTo : "SELF" });
    };
    const th = this.thresholdsFor(env);
    push(vitals.intracranialPressure, "NEURO", `PIC ${t.vitals.intracranialPressure} mmHg sobre el umbral de ${th.icpWarning} mmHg para ${env.label}: riesgo de SANS.`, "GROUND");
    push(vitals.bloodPressure, "CARDIO", `Presión arterial ${t.vitals.systolic}/${t.vitals.diastolic} mmHg fuera de rango para ${env.label}.`, "GROUND");
    push(vitals.spo2, "CARDIO", `Saturación de oxígeno baja (${t.vitals.spo2} %).`, "GROUND");
    const v = t.vitals;
    push(
      vitals.heartRate,
      "CARDIO",
      vitals.heartRate === "CRITICAL"
        ? `Frecuencia cardíaca ${v.heartRate} lpm: repite en reposo con un compañero y envía el ECG a los médicos de vuelo.`
        : `Frecuencia cardíaca ${v.heartRate} lpm fuera de rango: descansa y repite en reposo en 10 min.`,
      "GROUND"
    );
    push(
      vitals.respiratoryRate,
      "CARDIO",
      vitals.respiratoryRate === "CRITICAL"
        ? `Frecuencia respiratoria ${v.respiratoryRate} rpm: revisa el soporte vital de la cabina y avisa a los médicos de vuelo.`
        : `Frecuencia respiratoria ${v.respiratoryRate} rpm fuera de rango: revisa la atmósfera de la cabina y repite en 10 min.`,
      "GROUND"
    );
    push(
      vitals.temperature,
      "IMMUNE",
      v.coreTemperature < 36
        ? `Temperatura baja (${v.coreTemperature} °C): abrígate y repite en 30 min.`
        : vitals.temperature === "CRITICAL"
          ? `Fiebre alta (${v.coreTemperature} °C): un compañero debe confirmar la medición y aplicar el protocolo de fiebre del botiquín.`
          : `Temperatura ${v.coreTemperature} °C: descansa, hidrátate y repite en 1 h.`
    );
    push(
      vitals.glucose,
      "IMMUNE",
      v.glucose < 100
        ? `Glucosa baja (${v.glucose} mg/dL): come algo con azúcar ahora y repite en 15 min.${vitals.glucose === "CRITICAL" ? " Avisa a un compañero." : ""}`
        : `Glucosa alta (${v.glucose} mg/dL): repite la medición y revisa lo que comiste hoy.${vitals.glucose === "CRITICAL" ? " Avisa a un compañero." : ""}`
    );
    push(musculoskeletal.boneDensity, "MUSCULOSKELETAL", `Densidad ósea proyectada a 30 días: ${musculoskeletal.projectedBoneDeltaPct} %.`);
    push(musculoskeletal.fluidShift, "MUSCULOSKELETAL", `Desplazamiento de fluidos ${t.musculoskeletal.cephalicFluidShiftMmHg} mmHg frente a ${th.expectedFluidShiftMmHg} mmHg esperados.`);
    push(musculoskeletal.exercise, "MUSCULOSKELETAL", `Ejercicio por debajo del ritmo diario (${musculoskeletal.exerciseCompliancePct} % de ${musculoskeletal.exerciseTargetMinutes} min para ${env.label}).`);
    push(
      musculoskeletal.vision,
      "NEURO",
      musculoskeletal.vision === "CRITICAL"
        ? "Alteración visual importante: posible SANS. Prueba de agudeza visual y OCT, y reporte a los médicos de vuelo."
        : "Alteración visual leve: repite la prueba de agudeza visual en 12 h y vigila si empeora.",
      "GROUND"
    );
    push(musculoskeletal.dizziness, "NEURO", "Mareo o pérdida de equilibrio: evitar tareas en altura o EVA y moverse despacio hasta que remita.");
    const pct = Math.round(radiation.careerFraction * 100);
    if (radiation.shelterRequired) {
      const where = habitat ? habitat.shelter : "al refugio blindado";
      alerts.push({ severity: "CRITICAL", zone: "RADIATION", message: `Evento de partículas: toda la tripulación ${where} de inmediato.`, escalation: "CREW" });
      alerts.push({ severity: "WARNING", zone: "IMMUNE", message: "Tras la exposición: chequeo inmunológico (hemograma y recuento de linfocitos) con ayuda de un compañero.", escalation: "CREW" });
    } else if (radiation.cumulative === "CRITICAL") {
      alerts.push({ severity: "CRITICAL", zone: "RADIATION", message: `Dosis acumulada al ${pct} % del límite: dormir en la zona blindada, evitar EVA y hacer chequeo inmunológico.`, escalation: "GROUND" });
    } else push(radiation.overall, "RADIATION", `Dosis acumulada al ${pct} % del límite de carrera.`);
    if (mental.alerts.length)
      for (const message of mental.alerts)
        alerts.push({ severity: mental.trend === "CRITICAL" ? "CRITICAL" : "WARNING", zone: "WELLBEING", message, escalation: mental.trend === "CRITICAL" ? "GROUND" : "SELF" });
    else push(mental.overall, "WELLBEING", "El último check-in psicológico indica sueño, estrés o ánimo fuera de rango.", "GROUND");
    for (const msg of nutrition.alerts) alerts.push({ severity: "WARNING", zone: "NUTRITION", message: msg, escalation: "SELF" });

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

/** Keeps the last check-in of each UTC day, oldest first. */
function lastPerDay(history: readonly MentalCheckin[]): MentalCheckin[] {
  const byDay = new Map<string, MentalCheckin>();
  for (const c of [...history].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))) byDay.set(c.recordedAt.slice(0, 10), c);
  return [...byDay.values()];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;
