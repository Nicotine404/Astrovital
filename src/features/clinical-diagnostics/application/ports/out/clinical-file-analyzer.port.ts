import type { ClinicalFileKind } from "../../../domain/models/clinical-file.model";

export interface ClinicalAnalysisResult {
  findings: string;
  confidence: number;
  model: string;
  latencyMs: number;
}

/** On-device inference engine (WebGPU/WASM in the habitat; simulated in this build). */
export interface ClinicalFileAnalyzerPort {
  analyze(input: { name: string; kind: ClinicalFileKind; sizeMb: number }): Promise<ClinicalAnalysisResult>;
}
