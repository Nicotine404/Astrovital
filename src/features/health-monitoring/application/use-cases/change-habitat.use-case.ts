import { ClinicalRulesService } from "../../domain/services/clinical-rules.domain-service";
import { Habitat } from "../../domain/value-objects/habitat.vo";
import { dayFraction, type ClockPort } from "../ports/out/clock.port";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";
import { toHabitatDto, type HabitatDto } from "../dto/dashboard-summary.dto";
import type { ChangeHabitatDto } from "../dto/record-measurement.dto";

/** CU-04: the crew moves to another place; every member is re-evaluated against its gravity and routine. */
export class ChangeHabitatUseCase {
  constructor(
    private readonly repository: TelemetryRepositoryPort,
    private readonly rules: ClinicalRulesService,
    private readonly clock: ClockPort
  ) {}

  async execute(input: ChangeHabitatDto): Promise<HabitatDto> {
    const habitat = Habitat.from(input.habitatId);
    const environment = habitat.gravity;
    await this.repository.saveHabitat(habitat);
    const fraction = dayFraction(this.clock.now());
    const target = this.rules.thresholdsFor(environment).exerciseTargetMinutes;
    const crew = await this.repository.findAll();
    await Promise.all(
      crew.map((t) => {
        t.setExerciseTarget(target);
        t.replaceAssessments(this.rules.recalibrateAssessments(t, environment, fraction));
        return this.repository.save(t);
      })
    );
    return toHabitatDto(habitat);
  }
}
