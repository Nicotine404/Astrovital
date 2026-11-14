import type { Metadata } from "next";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { PageHeader } from "@/core/presentation/shared/PageHeader";
import { WellbeingView } from "@/features/health-monitoring/presentation/views/WellbeingView";

export const metadata: Metadata = { title: "Salud integral" };

export default async function WellbeingPage() {
  const { healthMonitoring } = await createServerContainer();
  const summary = await healthMonitoring.getAstronautTelemetry.execute();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Fisiología y bienestar · ${summary.environment.location} ${summary.environment.label}`}
        title="Salud integral del tripulante"
        description="Pérdida ósea y desplazamiento de fluidos según la gravedad del entorno, ejercicio de contramedida, check-in psicológico y objetivos nutricionales del día."
      />
      <WellbeingView summary={summary} />
    </div>
  );
}
