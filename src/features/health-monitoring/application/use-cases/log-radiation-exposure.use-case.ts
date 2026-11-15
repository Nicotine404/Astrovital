import { DomainError } from "../../domain/errors/domain.error";
import { ClinicalRulesService, type RadiationEvaluation } from "../../domain/services/clinical-rules.domain-service";
import type { ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import type { LogRadiationDto } from "../dto/record-measurement.dto";

export interface RadiationExposureResult {
  shelterRequired: boolean;
  evaluations: { astronautId: string; evaluation: RadiationEvaluation }[];
}

/** RF-02: log a dosimeter/CANS reading (one crew member or the whole habitat) and decide on shelter. */
export class LogRadiationExposureUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute({ astronautId, ...reading }: LogRadiationDto): Promise<RadiationExposureResult> {
    const targets = astronautId ? [await this.repository.findById(astronautId)] : await this.repository.findAll();
    if (targets.some((t) => !t)) throw new DomainError("Tripulante no encontrado", "NOT_FOUND");
    const recordedAt = this.clock.now().toISOString();
    // Readings are external levels; the habitat's shielding decides what the crew receives.
    const habitat = await this.repository.getHabitat();
    const received = { ...reading, doseRateMsvDay: habitat.shield(reading.doseRateMsvDay), neutronFlux: habitat.shield(reading.neutronFlux), recordedAt };
    const evaluations = [];
    for (const t of targets) {
      t!.logRadiation(received);
      await this.repository.save(t!);
      evaluations.push({ astronautId: t!.id, evaluation: this.rules.evaluateRadiation(t!.radiation) });
    }
    return { shelterRequired: evaluations.some((e) => e.evaluation.shelterRequired), evaluations };
  }
}
