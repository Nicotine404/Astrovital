"use client";

import { toast } from "sonner";
import { useHealthSessionStore } from "@/features/health-monitoring/presentation/controllers/useHealthSession.store";
import { ANALYSIS_PIPELINES } from "../../domain/models/clinical-file.model";
import type { DiagnosticsDto } from "../../application/dto/diagnostics.dto";
import { MultimodalAnalyzer } from "../components/MultimodalAnalyzer";
import { useClinicalAnalysisController } from "../controllers/useClinicalAnalysisController";

/**
 * Multimodal analyzer bound to the astronaut selected in the health-monitoring session.
 * "Couple" hands the finding's anatomical structure to the digital twin.
 */
export function ClinicalAnalysisView({ byAstronaut, defaultAstronautId }: { byAstronaut: Record<string, DiagnosticsDto>; defaultAstronautId: string }) {
  const selectedId = useHealthSessionStore((s) => s.selectedAstronautId);
  const selectStructure = useHealthSessionStore((s) => s.selectStructure);
  const astronautId = selectedId && byAstronaut[selectedId] ? selectedId : defaultAstronautId;
  return (
    <Bound
      key={astronautId}
      astronautId={astronautId}
      data={byAstronaut[astronautId]}
      onCouple={(structure, name) => {
        selectStructure(structure);
        toast.success(`Hallazgos de ${name} acoplados al gemelo digital`);
        document.getElementById("digital-twin")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    />
  );
}

function Bound({ astronautId, data, onCouple }: { astronautId: string; data: DiagnosticsDto | undefined; onCouple: (structure: (typeof ANALYSIS_PIPELINES)["pdf"]["structure"], name: string) => void }) {
  const c = useClinicalAnalysisController(astronautId, data?.files ?? []);
  return (
    <MultimodalAnalyzer
      files={c.files}
      active={c.active}
      running={c.progress}
      busy={c.isPending}
      onSelect={c.select}
      onIngest={c.ingest}
      onReanalyze={c.reanalyze}
      onCouple={(f) => onCouple(ANALYSIS_PIPELINES[f.kind].structure, f.name)}
    />
  );
}
