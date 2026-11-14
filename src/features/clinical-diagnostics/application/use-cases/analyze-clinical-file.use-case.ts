import { createClinicalFile, kindFromFileName } from "../../domain/models/clinical-file.model";
import type { ClockPort } from "@/features/health-monitoring/application/ports/out/clock.port";
import type { ClinicalFileAnalyzerPort } from "../ports/out/clinical-file-analyzer.port";
import type { DiagnosticsRepositoryPort } from "../ports/out/diagnostics-repository.port";
import { toClinicalFileDto, type AnalyzeClinicalFileInput, type ClinicalFileDto } from "../dto/diagnostics.dto";

/** Ingests a clinical study, runs the on-device model for its modality and stores the result. */
export class AnalyzeClinicalFileUseCase {
  constructor(
    private readonly repository: DiagnosticsRepositoryPort,
    private readonly analyzer: ClinicalFileAnalyzerPort,
    private readonly clock: ClockPort
  ) {}

  async execute(input: AnalyzeClinicalFileInput): Promise<ClinicalFileDto> {
    const kind = kindFromFileName(input.fileName);
    const sizeMb = Math.max(0.1, Math.round((input.sizeBytes / 1024 / 1024) * 10) / 10);
    const result = await this.analyzer.analyze({ name: input.fileName, kind, sizeMb });
    const now = this.clock.now();
    const file = createClinicalFile({
      id: `cf-${now.getTime().toString(36)}`,
      astronautId: input.astronautId,
      name: input.fileName,
      kind,
      sizeMb,
      capturedAt: now,
      ...result,
    });
    await this.repository.saveClinicalFile(file);
    return toClinicalFileDto(file);
  }
}
