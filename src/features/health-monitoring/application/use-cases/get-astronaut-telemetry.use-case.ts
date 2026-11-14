import { GravityEnvironment } from "../../domain/value-objects/gravity-environment.vo";
import { ClinicalRulesService } from "../../domain/services/clinical-rules.domain-service";
import { dayFraction, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import { toAstronautSummaryDto, toGravityEnvironmentDto, type DashboardSummaryDto } from "../dto/dashboard-summary.dto";

/** RF-01: full crew telemetry, evaluated against the current gravity environment. */
export class GetAstronautTelemetryUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute(): Promise<DashboardSummaryDto> {
    const [environment, crew] = await Promise.all([this.repository.getEnvironment(), this.repository.findAll()]);
    const now = this.clock.now();
    const fraction = dayFraction(now);
    return {
      environment: toGravityEnvironmentDto(environment),
      environments: GravityEnvironment.ALL.map(toGravityEnvironmentDto),
      thresholds: this.rules.thresholdsFor(environment),
      crew: crew.map((t) => toAstronautSummaryDto(t, environment, this.rules, fraction)),
      generatedAt: now.toISOString(),
    };
  }
}
