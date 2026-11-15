import seed from "./crew.seed.json";
import type {
  AstronautRow,
  MentalCheckinRow,
  MissionStateRow,
  MusculoskeletalHistoryRow,
  MusculoskeletalStatusRow,
  NutritionLogRow,
  OrganAssessmentRow,
  RadiationDosimetryRow,
  RadiationReadingRow,
  VitalSignsRow,
} from "../mappers/telemetry.mapper";

/** A full set of database tables, as PostgreSQL would hold them. */
export interface TelemetryTables {
  mission_state: MissionStateRow[];
  astronauts: AstronautRow[];
  vital_signs: VitalSignsRow[];
  organ_assessments: OrganAssessmentRow[];
  radiation_dosimetry: RadiationDosimetryRow[];
  radiation_readings: RadiationReadingRow[];
  musculoskeletal_status: MusculoskeletalStatusRow[];
  musculoskeletal_history: MusculoskeletalHistoryRow[];
  mental_checkins: MentalCheckinRow[];
  nutrition_logs: NutritionLogRow[];
}

/** Deterministic noise in [-1, 1]. */
const noise = (i: number, k = 0) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Per-crew profile not present in the original clinical dataset. */
const PROFILE: Record<string, { glucose: number; temp: number; fluid: number; elongation: number; exercise: number; muscle: number; sleep: number; stress: number; mood: number; intake: [number, number, number, number, number] }> = {
  rostova: { glucose: 96, temp: 36.9, fluid: 22, elongation: 3.2, exercise: 35, muscle: -2.1, sleep: 6.1, stress: 6, mood: 6, intake: [1150, 1100, 380, 300, 38] },
  thorne: { glucose: 88, temp: 36.7, fluid: 15, elongation: 2.9, exercise: 85, muscle: -0.9, sleep: 7.4, stress: 3, mood: 8, intake: [1400, 1500, 560, 420, 62] },
  khan: { glucose: 91, temp: 36.8, fluid: 16, elongation: 2.6, exercise: 70, muscle: -1.2, sleep: 7.1, stress: 4, mood: 7, intake: [1250, 1300, 520, 400, 55] },
  lee: { glucose: 93, temp: 36.7, fluid: 14, elongation: 3.0, exercise: 95, muscle: -0.6, sleep: 5.4, stress: 5, mood: 6, intake: [1300, 900, 600, 380, 58] },
};

const DAY = 86_400_000;

export function buildSeedTables(now: Date): TelemetryTables {
  const today = now.toISOString().slice(0, 10);
  const t: TelemetryTables = {
    mission_state: [{ id: 1, gravity_environment: "MARTIAN" }],
    astronauts: seed.astronauts,
    vital_signs: [],
    organ_assessments: seed.assessments as OrganAssessmentRow[],
    radiation_dosimetry: [],
    radiation_readings: [],
    musculoskeletal_status: [],
    musculoskeletal_history: [],
    mental_checkins: [],
    nutrition_logs: [],
  };

  seed.astronauts.forEach((a, ai) => {
    const b = seed.baselines[a.id as keyof typeof seed.baselines];
    const p = PROFILE[a.id];
    const DAYS = 28;

    // vitals: one sample per day for 4 weeks; ICP drifts up toward today's value
    for (let d = DAYS - 1; d >= 0; d--) {
      const i = ai * 100 + d;
      const drift = (DAYS - 1 - d) / (DAYS - 1);
      t.vital_signs.push({
        astronaut_id: a.id,
        recorded_at: new Date(now.getTime() - d * DAY).toISOString(),
        heart_rate: Math.round(b.heartRate + noise(i, 1) * 4),
        systolic: Math.round(b.systolic + noise(i, 2) * 5),
        diastolic: Math.round(b.diastolic + noise(i, 3) * 4),
        spo2: r1(Math.min(100, b.spo2 + noise(i, 4) * 0.6)),
        respiratory_rate: Math.round(b.respRate + noise(i, 5) * 1.5),
        core_temperature: r1(p.temp + noise(i, 6) * 0.2),
        glucose: Math.round(p.glucose + noise(i, 7) * 8),
        cardiac_output: r1(b.cardiacOutput + noise(i, 8) * 0.25),
        intracranial_pressure: r1(b.icp - (1 - drift) * (b.icp > 15 ? 4 : 1) + noise(i, 9) * 0.6),
      });
      t.musculoskeletal_history.push({
        astronaut_id: a.id,
        recorded_at: new Date(now.getTime() - d * DAY).toISOString(),
        bone_density_delta_pct: r2(b.boneDensityDelta * (0.7 + 0.3 * drift)),
        cephalic_fluid_shift_mmhg: r1(p.fluid + noise(i, 10) * 1.5),
        exercise_minutes: Math.max(0, Math.round(105 + noise(i, 11) * 30 - (a.id === "rostova" ? 30 : 0))),
      });
    }
    // the most recent vitals sample matches the clinical baseline exactly
    const last = t.vital_signs[t.vital_signs.length - 1];
    Object.assign(last, {
      heart_rate: b.heartRate,
      systolic: b.systolic,
      diastolic: b.diastolic,
      spo2: b.spo2,
      respiratory_rate: b.respRate,
      cardiac_output: b.cardiacOutput,
      intracranial_pressure: b.icp,
      core_temperature: p.temp,
      glucose: p.glucose,
    });

    // radiation: daily GCR background with one solar particle event 15 days ago
    for (let d = 29; d >= 0; d--) {
      const spe = d === 15;
      t.radiation_readings.push({
        astronaut_id: a.id,
        recorded_at: new Date(now.getTime() - d * DAY).toISOString(),
        source: spe ? "SPE" : "GCR",
        dose_rate_msv_day: spe ? 3.1 : r2(0.41 + noise(ai * 50 + d, 12) * 0.04),
        neutron_flux: spe ? 4.2 : r2(0.9 + noise(ai * 50 + d, 13) * 0.15),
        duration_hours: 24,
      });
    }
    t.radiation_dosimetry.push({ astronaut_id: a.id, cumulative_msv: b.radiationMSv, neutron_cumulative_msv: r1(b.radiationMSv * 0.18), career_limit_msv: 600 });

    t.musculoskeletal_status.push({
      astronaut_id: a.id,
      bone_density_delta_pct: b.boneDensityDelta,
      muscle_mass_delta_pct: p.muscle,
      cephalic_fluid_shift_mmhg: p.fluid,
      spinal_elongation_cm: p.elongation,
      exercise_minutes_today: p.exercise,
      exercise_target_minutes: 90, // MARTIAN routine (the seeded environment)
      vision_symptom: a.id === "rostova" ? 1 : 0, // SANS grade 1 in progress
      dizziness_symptom: 0,
      symptoms_recorded_at: a.id === "rostova" ? new Date(now.getTime() - 3_600_000).toISOString() : null,
    });

    for (let d = 13; d >= 0; d--) {
      const i = ai * 30 + d;
      t.mental_checkins.push({
        astronaut_id: a.id,
        recorded_at: new Date(now.getTime() - d * DAY).toISOString(),
        sleep_hours: d === 0 ? p.sleep : r1(Math.min(9, Math.max(4.5, p.sleep + 0.6 + noise(i, 14) * 0.8))),
        stress_level: d === 0 ? p.stress : Math.min(10, Math.max(1, Math.round(p.stress - 1 + noise(i, 15) * 1.5))),
        mood: d === 0 ? p.mood : Math.min(10, Math.max(1, Math.round(p.mood + noise(i, 16) * 1.2))),
        notes: null,
      });
    }

    t.nutrition_logs.push({ astronaut_id: a.id, log_date: today, calories_kcal: p.intake[0], water_ml: p.intake[1], calcium_mg: p.intake[2], vitamin_d_iu: p.intake[3], protein_g: p.intake[4] });
  });

  return t;
}
