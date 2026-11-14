import type { ClinicalFileKind } from "../../domain/models/clinical-file.model";
import type { ClinicalAnalysisResult, ClinicalFileAnalyzerPort } from "../../application/ports/out/clinical-file-analyzer.port";
import seed from "../persistence/seed/diagnostics.seed.json";

/**
 * Stand-in for the on-device inference runtime. Returns the reference finding for each
 * modality with a deterministic confidence/latency derived from the file, so results are stable.
 */
export class SimulatedClinicalAnalyzer implements ClinicalFileAnalyzerPort {
  async analyze({ name, kind, sizeMb }: { name: string; kind: ClinicalFileKind; sizeMb: number }): Promise<ClinicalAnalysisResult> {
    const template = seed.clinical_files.find((f) => f.kind === kind) ?? seed.clinical_files[0];
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const jitter = (h % 100) / 100;
    return {
      findings: template.findings,
      confidence: Math.round((template.confidence - jitter * 2.5) * 10) / 10,
      model: template.model,
      latencyMs: Math.round(template.latency_ms * (0.85 + jitter * 0.3) + sizeMb * 0.4),
    };
  }
}
