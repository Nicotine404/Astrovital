import { DomainError } from "../../domain/errors/domain.error";
import { createVitalSigns } from "../../domain/models/vital-signs.model";
import { ClinicalRulesService, type VitalsEvaluation } from "../../domain/services/clinical-rules.domain-service";
import { dayFraction, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import type { RecordVitalSignsDto } from "../dto/record-measurement.dto";

/** RF-01: store a vital-sign sample and return its clinical evaluation. */
export class RecordVitalSignsUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute({ astronautId, ...values }: RecordVitalSignsDto): Promise<VitalsEvaluation> {
    const telemetry = await this.repository.findById(astronautId);
    if (!telemetry) throw new DomainError("Tripulante no encontrado", "NOT_FOUND");
    const environment = await this.repository.getEnvironment();
    const now = this.clock.now();
    telemetry.recordVitals(createVitalSigns({ ...values, recordedAt: now.toISOString() }));
    telemetry.replaceAssessments(this.rules.recalibrateAssessments(telemetry, environment, dayFraction(now)));
    await this.repository.save(telemetry);
    return this.rules.evaluateVitals(telemetry.vitals, environment);
  }
}
