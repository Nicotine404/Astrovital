"use client";

import { CrewSwitcher } from "@/features/health-monitoring/presentation/components/crew/CrewSwitcher";
import { useHealthSessionStore } from "@/features/health-monitoring/presentation/controllers/useHealthSession.store";
import type { AstronautSummaryDto } from "@/features/health-monitoring/application/dto/dashboard-summary.dto";
import type { DiagnosticsDto } from "../../application/dto/diagnostics.dto";
import { DiagnosisList } from "../components/DiagnosisList";

export function DiagnosticsView({ crew, byAstronaut }: { crew: AstronautSummaryDto[]; byAstronaut: Record<string, DiagnosticsDto> }) {
  const selectedId = useHealthSessionStore((s) => s.selectedAstronautId);
  const selectAstronaut = useHealthSessionStore((s) => s.selectAstronaut);
  const member = crew.find((c) => c.astronaut.id === selectedId) ?? crew[0];
  if (!member) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CrewSwitcher crew={crew} selectedId={member.astronaut.id} onSelect={selectAstronaut} />
        <p className="text-[13px] text-muted-foreground">Hipótesis para {member.astronaut.name}. Requieren validación del oficial médico.</p>
      </div>
      <DiagnosisList diagnoses={byAstronaut[member.astronaut.id]?.diagnoses ?? []} />
    </div>
  );
}
