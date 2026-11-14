import type { Metadata } from "next";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { PageHeader } from "@/core/presentation/shared/PageHeader";
import { MedkitTable } from "@/features/mission-ops/presentation/components/MedkitTable";

export const metadata: Metadata = { title: "Botiquín" };

export default async function MedkitPage() {
  const { missionOps } = await createServerContainer();
  const inventory = await missionOps.getMedkitInventory.execute();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dispensario A-2 · en línea"
        title="Botiquín y dispensario EVA"
        description="Inventario de suministros médicos con liberación autorizada por UWB. Los consumos se registran automáticamente en el historial del tripulante."
      />
      <MedkitTable inventory={inventory} />
    </div>
  );
}
