import { rankDiagnoses } from "../../domain/models/diagnosis.model";
import type { DiagnosticsRepositoryPort } from "../ports/out/diagnostics-repository.port";
import { toClinicalFileDto, type DiagnosticsDto } from "../dto/diagnostics.dto";

/** Diagnostic hypotheses (primary first) and clinical studies for one astronaut. */
export class GetDiagnosticsUseCase {
  constructor(private readonly repository: DiagnosticsRepositoryPort) {}

  async execute(astronautId: string): Promise<DiagnosticsDto> {
    const [diagnoses, files] = await Promise.all([
      this.repository.findDiagnoses(astronautId),
      this.repository.findClinicalFiles(astronautId),
    ]);
    return {
      astronautId,
      diagnoses: rankDiagnoses(diagnoses),
      files: [...files].sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime()).map(toClinicalFileDto),
    };
  }
}
