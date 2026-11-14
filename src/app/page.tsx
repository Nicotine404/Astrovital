import { PageHeader } from "@/components/shared/page-header";
import { CrewSummary } from "@/components/dashboard/crew-summary";
import { DigitalTwin } from "@/components/twin/digital-twin";
import { VitalsStrip } from "@/components/dashboard/vitals-strip";
import { MultimodalAnalyzer } from "@/components/dashboard/multimodal-analyzer";
import { MISSION } from "@/lib/data/mock";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Panel general · Día de misión ${MISSION.missionDay}`}
        title="Estado médico de la tripulación"
        description="Vigilancia continua de los cuatro tripulantes. Una alerta activa requiere atención: SANS grado 1 en la comandante Rostova."
      />
      <CrewSummary />
      <div id="digital-twin" className="scroll-mt-20">
        <DigitalTwin />
      </div>
      <VitalsStrip />
      <MultimodalAnalyzer />
    </div>
  );
}
