import { createServerContainer } from "@/core/infrastructure/di/container";
import { PageHeader } from "@/core/presentation/shared/PageHeader";
import { ClinicalAnalysisView } from "@/features/clinical-diagnostics/presentation/views/ClinicalAnalysisView";
import { MissionOverviewView } from "@/features/health-monitoring/presentation/views/MissionOverviewView";

export default async function OverviewPage() {
  const { healthMonitoring, clinicalDiagnostics } = await createServerContainer();
  const summary = await healthMonitoring.getAstronautTelemetry.execute();
  const diagnostics = await Promise.all(summary.crew.map((c) => clinicalDiagnostics.getDiagnostics.execute(c.astronaut.id)));
  const flagged = summary.crew.filter((c) => c.overall !== "NOMINAL");
  const headline = flagged.length
    ? `${flagged.length} ${flagged.length === 1 ? "tripulante requiere" : "tripulantes requieren"} atención: ${flagged
        .map((c) => `${c.astronaut.shortName} (${c.alerts[0]?.message.replace(/\.$/, "").toLowerCase() ?? "revisión"})`)
        .join(" · ")}.`
    : "Todos los tripulantes dentro de márgenes nominales.";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Panel general · ${summary.habitat.label} · ${summary.environment.label}`}
        title="Tu estado de salud hoy"
        description={`Elige tu perfil, revisa tus alertas y tu misión del día, y toca una zona del cuerpo para ver qué pasa. ${headline}`}
      />
      <MissionOverviewView summary={summary} />
      <ClinicalAnalysisView byAstronaut={Object.fromEntries(diagnostics.map((d) => [d.astronautId, d]))} defaultAstronautId={summary.crew[0]?.astronaut.id ?? ""} />
    </div>
  );
}
