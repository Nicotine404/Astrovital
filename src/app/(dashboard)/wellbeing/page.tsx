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
        eyebrow={`Fisiología y bienestar · ${summary.habitat.label} · ${summary.environment.label}`}
        title="Tu cuerpo y tu mente"
        description="Registra tu ejercicio, cómo ves y cómo te sientes, y lo que comes y bebes. Las referencias se ajustan al lugar donde estás."
      />
      <WellbeingView summary={summary} />
    </div>
  );
}
