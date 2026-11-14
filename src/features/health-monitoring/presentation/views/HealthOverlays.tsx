"use client";

import type { DashboardSummaryDto } from "../../application/dto/dashboard-summary.dto";
import { CrisisProtocolDialog } from "../components/crisis/CrisisProtocolDialog";
import { VitalTrendsModal } from "../components/trends/VitalTrendsModal";
import { useHealthSessionStore } from "../controllers/useHealthSession.store";
import { useTelemetryController } from "../controllers/useTelemetryController";
import { useVitalTrendsController } from "../controllers/useVitalTrendsController";

/** Global dialogs of the health-monitoring context, mounted once in the dashboard layout. */
export function HealthOverlays({ summary }: { summary: DashboardSummaryDto }) {
  const { selected, environment } = useTelemetryController(summary);
  const crisisOpen = useHealthSessionStore((s) => s.crisisOpen);
  const setCrisisOpen = useHealthSessionStore((s) => s.setCrisisOpen);
  const trends = useVitalTrendsController(selected?.astronaut.id ?? "");
  if (!selected) return null;

  return (
    <>
      <CrisisProtocolDialog
        open={crisisOpen}
        onOpenChange={setCrisisOpen}
        gravityLabel={`${environment.location} · ${environment.label}`}
        commDelay={environment.commDelay}
        patientName={selected.astronaut.name}
      />
      <VitalTrendsModal
        zone={trends.zone}
        astronautName={selected.astronaut.name}
        gravityLabel={`${environment.location} (${environment.label})`}
        data={trends.data}
        pending={trends.isPending}
        onClose={trends.close}
      />
    </>
  );
}
