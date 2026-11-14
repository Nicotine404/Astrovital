import type { Metadata } from "next";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { PageHeader } from "@/core/presentation/shared/PageHeader";
import { RadiationView } from "@/features/health-monitoring/presentation/views/RadiationView";

export const metadata: Metadata = { title: "Dosimetría" };

export default async function RadiationPage() {
  const { healthMonitoring } = await createServerContainer();
  const summary = await healthMonitoring.getAstronautTelemetry.execute();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dosimetría · GCR, SPE y neutrones"
        title="Radiación espacial"
        description="Exposición a rayos cósmicos galácticos y eventos de partículas solares, flujo de neutrones del detector CANS y dosis acumulada frente al límite de carrera."
      />
      <RadiationView summary={summary} />
    </div>
  );
}
