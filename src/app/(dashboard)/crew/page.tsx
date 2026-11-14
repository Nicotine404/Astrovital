import type { Metadata } from "next";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { CrewView } from "@/features/health-monitoring/presentation/views/CrewView";

export const metadata: Metadata = { title: "Tripulación" };

export default async function CrewPage() {
  const { healthMonitoring } = await createServerContainer();
  return <CrewView summary={await healthMonitoring.getAstronautTelemetry.execute()} />;
}
