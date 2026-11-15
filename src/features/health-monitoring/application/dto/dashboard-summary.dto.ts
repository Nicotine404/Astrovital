import type { Astronaut, AstronautTelemetry } from "../../domain/models/astronaut-telemetry.model";
import type { MentalCheckin } from "../../domain/models/mental-health.model";
import type { Musculoskeletal } from "../../domain/models/musculoskeletal.model";
import type { NutritionLog } from "../../domain/models/nutrition-log.model";
import type { OrganAssessment } from "../../domain/models/organ-assessment.model";
import type { RadiationReading } from "../../domain/models/radiation-dosimetry.model";
import type { VitalSigns } from "../../domain/models/vital-signs.model";
import {
  NUTRITION_TARGETS,
  type ClinicalAlert,
  type ClinicalRulesService,
  type ClinicalThresholds,
  type MentalEvaluation,
  type MusculoskeletalEvaluation,
  type NutritionEvaluation,
  type RadiationEvaluation,
  type VitalsEvaluation,
} from "../../domain/services/clinical-rules.domain-service";
import type { BodyZone } from "../../domain/value-objects/body-zone.vo";
import type { DailyMission } from "../../domain/services/daily-mission.domain-service";
import type { GravityEnvironment, GravityEnvironmentId } from "../../domain/value-objects/gravity-environment.vo";
import type { Habitat, HabitatId } from "../../domain/value-objects/habitat.vo";
import type { HealthStatus } from "../../domain/value-objects/health-status.vo";

/* Plain, serialisable shapes: safe to send from Server Components to the client. */

export interface GravityEnvironmentDto {
  id: GravityEnvironmentId;
  g: number;
  label: string;
  location: string;
  commDelay: string;
  commDelaySeconds: number;
}

export interface HabitatDto {
  id: HabitatId;
  label: string;
  gravity: GravityEnvironmentDto;
  shielding: number;
  hasResistanceDevice: boolean;
  shelter: string;
}

export interface DosePointDto {
  recordedAt: string;
  cumulativeMsv: number;
  doseRateMsvDay: number;
  neutronFlux: number;
  source: RadiationReading["source"];
}

export interface AstronautSummaryDto {
  astronaut: Astronaut;
  vitals: VitalSigns;
  vitalsEvaluation: VitalsEvaluation;
  assessments: OrganAssessment[];
  radiation: {
    cumulativeMsv: number;
    neutronCumulativeMsv: number;
    careerLimitMsv: number;
    latest: RadiationReading | null;
    series: DosePointDto[];
    evaluation: RadiationEvaluation;
  };
  musculoskeletal: Musculoskeletal & { evaluation: MusculoskeletalEvaluation };
  mental: { latest: MentalCheckin | null; history: MentalCheckin[]; evaluation: MentalEvaluation };
  nutrition: { log: NutritionLog; targets: typeof NUTRITION_TARGETS; evaluation: NutritionEvaluation };
  zones: Record<BodyZone, HealthStatus>;
  overall: HealthStatus;
  healthIndex: number;
  alerts: ClinicalAlert[];
  mission: DailyMission;
}

export interface DashboardSummaryDto {
  habitat: HabitatDto;
  habitats: HabitatDto[];
  environment: GravityEnvironmentDto;
  environments: GravityEnvironmentDto[];
  /** Crew members who completed all of today's tasks (cooperative goal). */
  crewMissionsCompleted: number;
  thresholds: ClinicalThresholds;
  crew: AstronautSummaryDto[];
  generatedAt: string;
}

export const toGravityEnvironmentDto = (env: GravityEnvironment): GravityEnvironmentDto => ({
  id: env.id,
  g: env.g,
  label: env.label,
  location: env.location,
  commDelay: env.formatCommDelay(),
  commDelaySeconds: env.commDelaySeconds,
});

export const toHabitatDto = (h: Habitat): HabitatDto => ({
  id: h.id,
  label: h.label,
  gravity: toGravityEnvironmentDto(h.gravity),
  shielding: h.shielding,
  hasResistanceDevice: h.hasResistanceDevice,
  shelter: h.shelter,
});

/** Rebuilds the cumulative-dose curve from the reading log (newest reading = current total). */
function doseSeries(t: AstronautTelemetry): DosePointDto[] {
  const readings = t.radiation.readings;
  let cumulative = t.radiation.cumulativeMsv;
  const out: DosePointDto[] = [];
  for (let i = readings.length - 1; i >= 0; i--) {
    const r = readings[i];
    out.push({ recordedAt: r.recordedAt, cumulativeMsv: Math.round(cumulative * 100) / 100, doseRateMsvDay: r.doseRateMsvDay, neutronFlux: r.neutronFlux, source: r.source });
    cumulative -= (r.doseRateMsvDay * r.durationHours) / 24;
  }
  return out.reverse();
}

export function toAstronautSummaryDto(
  t: AstronautTelemetry,
  habitat: Habitat,
  rules: ClinicalRulesService,
  dayFraction: number,
  missionFor: (evaluation: ReturnType<ClinicalRulesService["evaluate"]>) => DailyMission
): AstronautSummaryDto {
  const env: GravityEnvironment = habitat.gravity;
  const evaluation = rules.evaluate(t, env, dayFraction, habitat);
  const snapshot = t.toSnapshot();
  return {
    astronaut: snapshot.astronaut,
    vitals: snapshot.vitals,
    vitalsEvaluation: evaluation.vitals,
    assessments: rules.recalibrateAssessments(t, env, dayFraction),
    radiation: {
      cumulativeMsv: snapshot.radiation.cumulativeMsv,
      neutronCumulativeMsv: snapshot.radiation.neutronCumulativeMsv,
      careerLimitMsv: snapshot.radiation.careerLimitMsv,
      latest: snapshot.radiation.readings.at(-1) ?? null,
      series: doseSeries(t),
      evaluation: evaluation.radiation,
    },
    musculoskeletal: { ...snapshot.musculoskeletal, evaluation: evaluation.musculoskeletal },
    mental: { latest: snapshot.mentalCheckins.at(-1) ?? null, history: snapshot.mentalCheckins.slice(-14), evaluation: evaluation.mental },
    nutrition: { log: snapshot.nutrition, targets: NUTRITION_TARGETS, evaluation: evaluation.nutrition },
    zones: evaluation.zones,
    overall: evaluation.overall,
    healthIndex: evaluation.healthIndex,
    alerts: evaluation.alerts,
    mission: missionFor(evaluation),
  };
}
