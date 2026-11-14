import { HealthStatus } from "@/features/health-monitoring/domain/value-objects/health-status.vo";
import { MissionOpsRules } from "../../domain/services/mission-ops-rules.domain-service";
import type { MissionOpsRepositoryPort } from "../ports/out/mission-ops-repository.port";
import type { CabinEnvironmentDto } from "../dto/mission-ops.dto";

export class GetCabinEnvironmentUseCase {
  constructor(private readonly repository: MissionOpsRepositoryPort) {}

  async execute(): Promise<CabinEnvironmentDto> {
    const readings = (await this.repository.findEclssReadings()).map((r) => ({ ...r, status: MissionOpsRules.eclssStatus(r) }));
    return { readings, overall: HealthStatus.worst(...readings.map((r) => r.status)) };
  }
}
