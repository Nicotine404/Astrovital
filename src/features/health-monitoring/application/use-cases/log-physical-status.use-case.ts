import { DomainError } from "../../domain/errors/domain.error";
import type { AstronautTelemetry } from "../../domain/models/astronaut-telemetry.model";
import { ClinicalRulesService, type MusculoskeletalEvaluation } from "../../domain/services/clinical-rules.domain-service";
import { dayFraction, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import type { LogExerciseDto, ReportSymptomsDto } from "../dto/record-measurement.dto";

/** CU-05: countermeasure exercise and vision / dizziness self-reports, evaluated for the current gravity. */
export class LogPhysicalStatusUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  logExercise({ astronautId, minutes }: LogExerciseDto): Promise<MusculoskeletalEvaluation> {
    return this.update(astronautId, (t) => t.logExercise(minutes));
  }

  reportSymptoms({ astronautId, vision, dizziness }: ReportSymptomsDto): Promise<MusculoskeletalEvaluation> {
    return this.update(astronautId, (t) => t.reportSymptoms(vision, dizziness, this.clock.now().toISOString()));
  }

  private async update(astronautId: string, change: (t: AstronautTelemetry) => void): Promise<MusculoskeletalEvaluation> {
    const telemetry = await this.repository.findById(astronautId);
    if (!telemetry) throw new DomainError("Tripulante no encontrado", "NOT_FOUND");
    const environment = await this.repository.getEnvironment();
    const fraction = dayFraction(this.clock.now());
    change(telemetry);
    telemetry.replaceAssessments(this.rules.recalibrateAssessments(telemetry, environment, fraction));
    await this.repository.save(telemetry);
    return this.rules.evaluateMusculoskeletal(telemetry.musculoskeletal, environment, fraction);
  }
}
