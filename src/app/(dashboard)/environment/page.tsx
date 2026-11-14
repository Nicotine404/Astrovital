import type { Metadata } from "next";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { PageHeader } from "@/core/presentation/shared/PageHeader";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { EclssReadingCard } from "@/features/mission-ops/presentation/components/EclssReadingCard";

export const metadata: Metadata = { title: "Soporte vital" };

export default async function EnvironmentPage() {
  const { missionOps } = await createServerContainer();
  const cabin = await missionOps.getCabinEnvironment.execute();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ECLSS · control ambiental y soporte vital"
        title="Atmósfera de cabina"
        description="Composición del aire, presión, temperatura y recuperación de agua del hábitat. Los valores fuera de banda nominal generan alertas automáticas."
        actions={<StatusBadge status={cabin.overall} label={cabin.overall === "NOMINAL" ? "Todos los canales nominales" : undefined} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cabin.readings.map((r) => (
          <EclssReadingCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
