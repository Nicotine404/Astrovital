import { HealthStatus } from "@/features/health-monitoring/domain/value-objects/health-status.vo";
import { MissionOpsRules } from "../../domain/services/mission-ops-rules.domain-service";
import type { MissionOpsRepositoryPort } from "../ports/out/mission-ops-repository.port";
import type { MedkitInventoryDto } from "../dto/mission-ops.dto";

export class GetMedkitInventoryUseCase {
  constructor(private readonly repository: MissionOpsRepositoryPort) {}

  async execute(): Promise<MedkitInventoryDto> {
    const items = (await this.repository.findMedkitItems()).map((item) => ({
      ...item,
      status: MissionOpsRules.stockStatus(item),
      fillPct: Math.round(MissionOpsRules.stockRatio(item) * 100),
    }));
    return { items, restockCount: items.filter((i) => i.status !== HealthStatus.NOMINAL).length };
  }
}
