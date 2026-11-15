import { DomainError } from "../../domain/errors/domain.error";
import { createMentalCheckin } from "../../domain/models/mental-health.model";
import { ClinicalRulesService, type MentalEvaluation } from "../../domain/services/clinical-rules.domain-service";
import type { ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import type { MentalCheckinDto } from "../dto/record-measurement.dto";

/** RF-05: record a sleep / stress / mood check-in. */
export class LogMentalCheckinUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute({ astronautId, ...input }: MentalCheckinDto): Promise<MentalEvaluation> {
    const telemetry = await this.repository.findById(astronautId);
    if (!telemetry) throw new DomainError("Tripulante no encontrado", "NOT_FOUND");
    telemetry.logMentalCheckin(createMentalCheckin({ ...input, recordedAt: this.clock.now().toISOString() }));
    await this.repository.save(telemetry);
    return this.rules.evaluateMental(telemetry.mentalCheckins);
  }
}
