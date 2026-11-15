/** Test data builders: sensible defaults, override only what each test cares about. */
import { AstronautTelemetry } from "@/features/health-monitoring/domain/models/astronaut-telemetry.model";
import type { MentalCheckin } from "@/features/health-monitoring/domain/models/mental-health.model";
import type { Musculoskeletal } from "@/features/health-monitoring/domain/models/musculoskeletal.model";
import type { RadiationDosimetry } from "@/features/health-monitoring/domain/models/radiation-dosimetry.model";
import type { VitalSigns } from "@/features/health-monitoring/domain/models/vital-signs.model";

export const TODAY = "2026-11-15";

export const aVitals = (over: Partial<VitalSigns> = {}): VitalSigns => ({
  recordedAt: `${TODAY}T08:00:00.000Z`,
  heartRate: 64,
  systolic: 118,
  diastolic: 74,
  spo2: 98,
  respiratoryRate: 14,
  coreTemperature: 36.8,
  glucose: 92,
  cardiacOutput: 5,
  intracranialPressure: 12,
  ...over,
});

export const aMusculoskeletal = (over: Partial<Musculoskeletal> = {}): Musculoskeletal => ({
  boneDensityDeltaPct: 0,
  muscleMassDeltaPct: 0,
  cephalicFluidShiftMmHg: 15,
  spinalElongationCm: 2,
  exerciseMinutesToday: 0,
  exerciseTargetMinutes: 90,
  exerciseLoggedOn: TODAY,
  visionSymptom: 0,
  dizzinessSymptom: 0,
  symptomsRecordedAt: null,
  ...over,
});

export const aDosimetry = (reading: { doseRateMsvDay: number; neutronFlux: number; source?: "GCR" | "SPE" }, cumulativeMsv = 140): RadiationDosimetry => ({
  cumulativeMsv,
  neutronCumulativeMsv: 20,
  careerLimitMsv: 600,
  readings: [{ recordedAt: `${TODAY}T08:00:00.000Z`, source: reading.source ?? "SPE", doseRateMsvDay: reading.doseRateMsvDay, neutronFlux: reading.neutronFlux, durationHours: 3 }],
});

/** One check-in per day of November 2026. */
export const aCheckin = (dayOfMonth: number, sleepHours: number, mood: number, stressLevel = 4): MentalCheckin => ({
  recordedAt: new Date(Date.UTC(2026, 10, dayOfMonth, 8)).toISOString(),
  sleepHours,
  stressLevel,
  mood,
});

export const anAstronaut = (over: { exerciseMinutesToday?: number; vitalsAt?: string; vitals?: Partial<VitalSigns> } = {}) =>
  AstronautTelemetry.create({
    astronaut: { id: "a1", name: "Test Astronaut", shortName: "T. Astronaut", initials: "TA", role: "Test", suitId: "S-1", bloodType: "O+", heightCm: 175, note: "" },
    vitals: aVitals({ recordedAt: over.vitalsAt ?? `${TODAY}T08:00:00.000Z`, ...over.vitals }),
    assessments: [],
    radiation: { cumulativeMsv: 0, neutronCumulativeMsv: 0, careerLimitMsv: 600, readings: [] },
    musculoskeletal: aMusculoskeletal({ exerciseMinutesToday: over.exerciseMinutesToday ?? 0 }),
    mentalCheckins: [],
    nutrition: { date: TODAY, caloriesKcal: 0, waterMl: 0, calciumMg: 0, vitaminDIu: 0, proteinG: 0 },
  });
