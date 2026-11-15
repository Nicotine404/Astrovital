import { GravityEnvironment } from "../../domain/value-objects/gravity-environment.vo";
import { Habitat } from "../../domain/value-objects/habitat.vo";
import { ClinicalRulesService } from "../../domain/services/clinical-rules.domain-service";
import { DailyMissionService } from "../../domain/services/daily-mission.domain-service";
import { dayFraction, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import { toAstronautSummaryDto, toGravityEnvironmentDto, toHabitatDto, type DashboardSummaryDto } from "../dto/dashboard-summary.dto";

/** RF-01: full crew telemetry, evaluated against the current gravity environment. */
export class GetAstronautTelemetryUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly mission: DailyMissionService,
    private readonly clock: ClockPort
  ) {}

  async execute(): Promise<DashboardSummaryDto> {
    const [habitat, crew] = await Promise.all([this.repository.getHabitat(), this.repository.findAll()]);
    const environment = habitat.gravity;
    const now = this.clock.now();
    const fraction = dayFraction(now);
    const histories = await Promise.all(crew.map((t) => this.repository.getMusculoskeletalHistory(t.id, 14)));
    const summaries = crew.map((t, i) => toAstronautSummaryDto(t, habitat, this.rules, fraction, (ev) => this.mission.build(t, ev, now, histories[i])));
    return {
      habitat: toHabitatDto(habitat),
      habitats: Habitat.ALL.map(toHabitatDto),
      environment: toGravityEnvironmentDto(environment),
      environments: GravityEnvironment.ALL.map(toGravityEnvironmentDto),
      crewMissionsCompleted: summaries.filter((s) => s.mission.completed === s.mission.tasks.length).length,
      thresholds: this.rules.thresholdsFor(environment),
      crew: summaries,
      generatedAt: now.toISOString(),
    };
  }
}
