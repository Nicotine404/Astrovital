import { ClinicalRulesService } from "../../domain/services/clinical-rules.domain-service";
import { GravityEnvironment } from "../../domain/value-objects/gravity-environment.vo";
import { dayFraction, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import { toGravityEnvironmentDto, type GravityEnvironmentDto } from "../dto/dashboard-summary.dto";
import type { ChangeGravityDto } from "../dto/record-measurement.dto";

/** RF-03: switch the operational gravity and re-evaluate every crew member against the new limits. */
export class ChangeGravityEnvironmentUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute(input: ChangeGravityDto): Promise<GravityEnvironmentDto> {
    const environment = GravityEnvironment.from(input.environmentId);
    await this.repository.saveEnvironment(environment);
    const fraction = dayFraction(this.clock.now());
    const crew = await this.repository.findAll();
    await Promise.all(
      crew.map((t) => {
        t.replaceAssessments(this.rules.recalibrateAssessments(t, environment, fraction));
        return this.repository.save(t);
      })
    );
    return toGravityEnvironmentDto(environment);
  }
}
