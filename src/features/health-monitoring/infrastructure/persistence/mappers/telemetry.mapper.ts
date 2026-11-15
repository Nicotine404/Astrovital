import { AstronautTelemetry } from "../../../domain/models/astronaut-telemetry.model";
import type { AssessmentMetric, OrganAssessment } from "../../../domain/models/organ-assessment.model";
import type { SymptomSeverity } from "../../../domain/models/musculoskeletal.model";
import type { RadiationSource } from "../../../domain/models/radiation-dosimetry.model";
import type { VitalSigns } from "../../../domain/models/vital-signs.model";
import { isAnatomicalStructure } from "../../../domain/value-objects/anatomical-structure.vo";
import { GravityEnvironment } from "../../../domain/value-objects/gravity-environment.vo";
import { HealthStatus } from "../../../domain/value-objects/health-status.vo";
import type { MusculoskeletalSample } from "../../../application/ports/out/telemetry-repository.port";

/* ------------------------------------------------------------------ */
/* PostgreSQL rows (snake_case). The only place they are converted.    */
/* ------------------------------------------------------------------ */
export interface MissionStateRow {
  id: number;
  gravity_environment: string;
  updated_at?: string;
}
export interface AstronautRow {
  id: string;
  name: string;
  short_name: string;
  initials: string;
  role: string;
  suit_id: string;
  blood_type: string;
  height_cm: number;
  note: string;
}
export interface VitalSignsRow {
  astronaut_id: string;
  recorded_at: string;
  heart_rate: number;
  systolic: number;
  diastolic: number;
  spo2: number;
  respiratory_rate: number;
  core_temperature: number;
  glucose: number;
  cardiac_output: number;
  intracranial_pressure: number;
}
export interface OrganAssessmentRow {
  astronaut_id: string;
  structure_id: string;
  clinical_status: string;
  status: string;
  title: string;
  summary: string;
  metrics: AssessmentMetric[];
  recommended_action: string;
}
export interface RadiationDosimetryRow {
  astronaut_id: string;
  cumulative_msv: number;
  neutron_cumulative_msv: number;
  career_limit_msv: number;
}
export interface RadiationReadingRow {
  astronaut_id: string;
  recorded_at: string;
  source: string;
  dose_rate_msv_day: number;
  neutron_flux: number;
  duration_hours: number;
}
export interface MusculoskeletalStatusRow {
  astronaut_id: string;
  bone_density_delta_pct: number;
  muscle_mass_delta_pct: number;
  cephalic_fluid_shift_mmhg: number;
  spinal_elongation_cm: number;
  exercise_minutes_today: number;
  exercise_target_minutes: number;
  vision_symptom: number;
  dizziness_symptom: number;
  symptoms_recorded_at: string | null;
}
export interface MusculoskeletalHistoryRow {
  astronaut_id: string;
  recorded_at: string;
  bone_density_delta_pct: number;
  cephalic_fluid_shift_mmhg: number;
  exercise_minutes: number;
}
export interface MentalCheckinRow {
  astronaut_id: string;
  recorded_at: string;
  sleep_hours: number;
  stress_level: number;
  mood: number;
  notes: string | null;
}
export interface NutritionLogRow {
  astronaut_id: string;
  log_date: string;
  calories_kcal: number;
  water_ml: number;
  calcium_mg: number;
  vitamin_d_iu: number;
  protein_g: number;
}

/** Everything persisted for one crew member. */
export interface AstronautRowSet {
  astronaut: AstronautRow;
  latestVitals: VitalSignsRow;
  assessments: OrganAssessmentRow[];
  dosimetry: RadiationDosimetryRow;
  readings: RadiationReadingRow[];
  musculoskeletal: MusculoskeletalStatusRow;
  checkins: MentalCheckinRow[];
  nutrition: NutritionLogRow | null;
}

const num = (v: unknown) => Number(v);
const status = (v: string): HealthStatus => (HealthStatus.isValid(v) ? v : "NOMINAL");
/** Older rows (before migration 0002) have no symptom columns: treat as "none". */
const severity = (v: unknown): SymptomSeverity => {
  const n = Number(v ?? 0);
  return (Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0) as SymptomSeverity;
};

export const TelemetryMapper = {
  environmentToDomain(row: MissionStateRow | null): GravityEnvironment {
    return GravityEnvironment.from(row?.gravity_environment ?? "MARTIAN");
  },
  environmentToRow(env: GravityEnvironment): MissionStateRow {
    return { id: 1, gravity_environment: env.id, updated_at: new Date().toISOString() };
  },

  vitalsToDomain(r: VitalSignsRow): VitalSigns {
    return {
      recordedAt: r.recorded_at,
      heartRate: num(r.heart_rate),
      systolic: num(r.systolic),
      diastolic: num(r.diastolic),
      spo2: num(r.spo2),
      respiratoryRate: num(r.respiratory_rate),
      coreTemperature: num(r.core_temperature),
      glucose: num(r.glucose),
      cardiacOutput: num(r.cardiac_output),
      intracranialPressure: num(r.intracranial_pressure),
    };
  },
  vitalsToRow(astronautId: string, v: VitalSigns): VitalSignsRow {
    return {
      astronaut_id: astronautId,
      recorded_at: v.recordedAt,
      heart_rate: v.heartRate,
      systolic: v.systolic,
      diastolic: v.diastolic,
      spo2: v.spo2,
      respiratory_rate: v.respiratoryRate,
      core_temperature: v.coreTemperature,
      glucose: v.glucose,
      cardiac_output: v.cardiacOutput,
      intracranial_pressure: v.intracranialPressure,
    };
  },

  mskHistoryToSample(r: MusculoskeletalHistoryRow): MusculoskeletalSample {
    return {
      recordedAt: r.recorded_at,
      boneDensityDeltaPct: num(r.bone_density_delta_pct),
      cephalicFluidShiftMmHg: num(r.cephalic_fluid_shift_mmhg),
      exerciseMinutes: num(r.exercise_minutes),
    };
  },

  /** `today` (YYYY-MM-DD): a nutrition row from another day starts a fresh log. */
  toDomain(set: AstronautRowSet, today: string): AstronautTelemetry {
    const a = set.astronaut;
    const assessments: OrganAssessment[] = set.assessments
      .filter((r) => isAnatomicalStructure(r.structure_id))
      .map((r) => ({
        structureId: r.structure_id as OrganAssessment["structureId"],
        clinicalStatus: status(r.clinical_status),
        status: status(r.status),
        title: r.title,
        summary: r.summary,
        metrics: Array.isArray(r.metrics) ? r.metrics : [],
        recommendedAction: r.recommended_action,
      }));
    const n = set.nutrition && set.nutrition.log_date === today ? set.nutrition : null;
    return AstronautTelemetry.create({
      astronaut: {
        id: a.id,
        name: a.name,
        shortName: a.short_name,
        initials: a.initials,
        role: a.role,
        suitId: a.suit_id,
        bloodType: a.blood_type,
        heightCm: num(a.height_cm),
        note: a.note ?? "",
      },
      vitals: TelemetryMapper.vitalsToDomain(set.latestVitals),
      assessments,
      radiation: {
        cumulativeMsv: num(set.dosimetry.cumulative_msv),
        neutronCumulativeMsv: num(set.dosimetry.neutron_cumulative_msv),
        careerLimitMsv: num(set.dosimetry.career_limit_msv),
        readings: [...set.readings]
          .sort((x, y) => x.recorded_at.localeCompare(y.recorded_at))
          .map((r) => ({
            recordedAt: r.recorded_at,
            source: (r.source === "SPE" ? "SPE" : "GCR") as RadiationSource,
            doseRateMsvDay: num(r.dose_rate_msv_day),
            neutronFlux: num(r.neutron_flux),
            durationHours: num(r.duration_hours),
          })),
      },
      musculoskeletal: {
        boneDensityDeltaPct: num(set.musculoskeletal.bone_density_delta_pct),
        muscleMassDeltaPct: num(set.musculoskeletal.muscle_mass_delta_pct),
        cephalicFluidShiftMmHg: num(set.musculoskeletal.cephalic_fluid_shift_mmhg),
        spinalElongationCm: num(set.musculoskeletal.spinal_elongation_cm),
        exerciseMinutesToday: num(set.musculoskeletal.exercise_minutes_today),
        exerciseTargetMinutes: num(set.musculoskeletal.exercise_target_minutes),
        visionSymptom: severity(set.musculoskeletal.vision_symptom),
        dizzinessSymptom: severity(set.musculoskeletal.dizziness_symptom),
        symptomsRecordedAt: set.musculoskeletal.symptoms_recorded_at ?? null,
      },
      mentalCheckins: [...set.checkins]
        .sort((x, y) => x.recorded_at.localeCompare(y.recorded_at))
        .map((c) => ({ recordedAt: c.recorded_at, sleepHours: num(c.sleep_hours), stressLevel: num(c.stress_level), mood: num(c.mood), notes: c.notes ?? undefined })),
      nutrition: {
        date: today,
        caloriesKcal: n ? num(n.calories_kcal) : 0,
        waterMl: n ? num(n.water_ml) : 0,
        calciumMg: n ? num(n.calcium_mg) : 0,
        vitaminDIu: n ? num(n.vitamin_d_iu) : 0,
        proteinG: n ? num(n.protein_g ?? 0) : 0,
      },
    });
  },

  toRowSet(t: AstronautTelemetry): AstronautRowSet {
    const s = t.toSnapshot();
    const id = s.astronaut.id;
    return {
      astronaut: {
        id,
        name: s.astronaut.name,
        short_name: s.astronaut.shortName,
        initials: s.astronaut.initials,
        role: s.astronaut.role,
        suit_id: s.astronaut.suitId,
        blood_type: s.astronaut.bloodType,
        height_cm: s.astronaut.heightCm,
        note: s.astronaut.note,
      },
      latestVitals: TelemetryMapper.vitalsToRow(id, s.vitals),
      assessments: s.assessments.map((a) => ({
        astronaut_id: id,
        structure_id: a.structureId,
        clinical_status: a.clinicalStatus,
        status: a.status,
        title: a.title,
        summary: a.summary,
        metrics: a.metrics,
        recommended_action: a.recommendedAction,
      })),
      dosimetry: {
        astronaut_id: id,
        cumulative_msv: s.radiation.cumulativeMsv,
        neutron_cumulative_msv: s.radiation.neutronCumulativeMsv,
        career_limit_msv: s.radiation.careerLimitMsv,
      },
      readings: s.radiation.readings.map((r) => ({
        astronaut_id: id,
        recorded_at: r.recordedAt,
        source: r.source,
        dose_rate_msv_day: r.doseRateMsvDay,
        neutron_flux: r.neutronFlux,
        duration_hours: r.durationHours,
      })),
      musculoskeletal: {
        astronaut_id: id,
        bone_density_delta_pct: s.musculoskeletal.boneDensityDeltaPct,
        muscle_mass_delta_pct: s.musculoskeletal.muscleMassDeltaPct,
        cephalic_fluid_shift_mmhg: s.musculoskeletal.cephalicFluidShiftMmHg,
        spinal_elongation_cm: s.musculoskeletal.spinalElongationCm,
        exercise_minutes_today: s.musculoskeletal.exerciseMinutesToday,
        exercise_target_minutes: s.musculoskeletal.exerciseTargetMinutes,
        vision_symptom: s.musculoskeletal.visionSymptom,
        dizziness_symptom: s.musculoskeletal.dizzinessSymptom,
        symptoms_recorded_at: s.musculoskeletal.symptomsRecordedAt,
      },
      checkins: s.mentalCheckins.map((c) => ({
        astronaut_id: id,
        recorded_at: c.recordedAt,
        sleep_hours: c.sleepHours,
        stress_level: c.stressLevel,
        mood: c.mood,
        notes: c.notes ?? null,
      })),
      nutrition: {
        astronaut_id: id,
        log_date: s.nutrition.date,
        calories_kcal: s.nutrition.caloriesKcal,
        water_ml: s.nutrition.waterMl,
        calcium_mg: s.nutrition.calciumMg,
        vitamin_d_iu: s.nutrition.vitaminDIu,
        protein_g: s.nutrition.proteinG,
      },
    };
  },
};
