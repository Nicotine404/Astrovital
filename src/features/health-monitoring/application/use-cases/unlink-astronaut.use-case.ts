import { DomainError } from "../../domain/errors/domain.error";
import type { TelemetryRepositoryPort } from "../ports/out/telemetry-repository.port";

/** Detaches a crew member's telemetry stream (the last crew member cannot be removed). */
export class UnlinkAstronautUseCase {
  constructor(private readonly repository: TelemetryRepositoryPort) {}

  async execute({ astronautId }: { astronautId: string }): Promise<void> {
    const crew = await this.repository.findAll();
    if (!crew.some((t) => t.id === astronautId)) throw new DomainError("Tripulante no encontrado", "NOT_FOUND");
    if (crew.length <= 1) throw new DomainError("Debe quedar al menos un tripulante monitorizado", "LAST_CREW_MEMBER");
    await this.repository.delete(astronautId);
  }
}
