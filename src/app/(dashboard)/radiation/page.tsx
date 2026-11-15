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
        title="Tu exposición a la radiación"
        description="Cuánta radiación recibes según el blindaje de tu hábitat, el flujo de neutrones del detector CANS y tu dosis acumulada frente al límite de carrera. Si llega una tormenta solar, aquí verás a dónde ir."
      />
      <RadiationView summary={summary} />
    </div>
  );
}
