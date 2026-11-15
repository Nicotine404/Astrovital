import { AstronautTelemetry } from "../../domain/models/astronaut-telemetry.model";
import { ANATOMICAL_STRUCTURES, STRUCTURES } from "../../domain/value-objects/anatomical-structure.vo";
import { emptyNutritionLog } from "../../domain/models/nutrition-log.model";
import { CAREER_DOSE_LIMIT_MSV, ClinicalRulesService } from "../../domain/services/clinical-rules.domain-service";
import { isoDate, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import type { RegisterAstronautDto } from "../dto/record-measurement.dto";

/** Links a new crew member's suit telemetry, starting from a nominal baseline. */
export class RegisterAstronautUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute(input: RegisterAstronautDto): Promise<{ id: string }> {
    const now = this.clock.now();
    const { exerciseTargetMinutes } = this.rules.thresholdsFor(await this.repository.getEnvironment());
    const words = input.name.split(/\s+/).filter(Boolean);
    const id = `crew-${now.getTime().toString(36)}`;
    const telemetry = AstronautTelemetry.create({
      astronaut: {
        id,
        name: input.name,
        shortName: words.slice(-2).join(" "),
        initials: words.map((w) => w[0]).join("").slice(-2).toUpperCase(),
        role: input.role,
        suitId: input.suitId,
        bloodType: input.bloodType,
        heightCm: input.heightCm,
        note: "Enlace de telemetría recién acoplado",
      },
      vitals: {
        recordedAt: now.toISOString(),
        heartRate: 68,
        systolic: 119,
        diastolic: 76,
        spo2: 98.5,
        respiratoryRate: 14,
        coreTemperature: 36.8,
        glucose: 92,
        cardiacOutput: 5,
        intracranialPressure: 12,
      },
      assessments: ANATOMICAL_STRUCTURES.map((structureId) => ({
        structureId,
        clinicalStatus: "NOMINAL",
        status: "NOMINAL",
        title: "Sin hallazgos",
        summary: `Línea base registrada para ${STRUCTURES[structureId].name.toLowerCase()}. Sin evaluaciones clínicas todavía.`,
        metrics: [{ label: "Estado", value: "Línea base" }],
        recommendedAction: "Programar evaluación inicial",
      })),
      radiation: { cumulativeMsv: 0, neutronCumulativeMsv: 0, careerLimitMsv: CAREER_DOSE_LIMIT_MSV, readings: [] },
      musculoskeletal: { boneDensityDeltaPct: 0, muscleMassDeltaPct: 0, cephalicFluidShiftMmHg: 0, spinalElongationCm: 0, exerciseMinutesToday: 0, exerciseTargetMinutes, visionSymptom: 0, dizzinessSymptom: 0, symptomsRecordedAt: null },
      mentalCheckins: [],
      nutrition: emptyNutritionLog(isoDate(now)),
    });
    await this.repository.save(telemetry);
    return { id };
  }
}
