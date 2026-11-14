import { DomainError } from "../../domain/errors/domain.error";
import { ClinicalRulesService, type NutritionEvaluation } from "../../domain/services/clinical-rules.domain-service";
import { dayFraction, isoDate, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import type { NutritionIntakeDto } from "../dto/record-measurement.dto";

/** RF-06: add an intake (optional) and validate the day's nutrition against targets and upper limits. */
export class ValidateDailyNutritionUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute({ astronautId, ...intake }: Partial<NutritionIntakeDto> & { astronautId: string }): Promise<NutritionEvaluation> {
    const telemetry = await this.repository.findById(astronautId);
    if (!telemetry) throw new DomainError("Tripulante no encontrado", "NOT_FOUND");
    const now = this.clock.now();
    if (Object.values(intake).some((v) => typeof v === "number" && v > 0)) {
      telemetry.logNutrition(intake, isoDate(now));
      await this.repository.save(telemetry);
    }
    return this.rules.evaluateNutrition(telemetry.nutrition, dayFraction(now));
  }
}
