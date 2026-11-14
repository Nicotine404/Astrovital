"use client";

import * as React from "react";
import { toast } from "sonner";
import type { BodyZone } from "../../domain/value-objects/body-zone.vo";
import type { VitalHistoryDto } from "../../application/dto/vital-history.dto";
import { getVitalHistoryAction } from "../actions/telemetry.actions";
import { useHealthSessionStore } from "./useHealthSession.store";

/** RF-01: opens the trends modal for a body zone and fetches its 28-day series. */
export function useVitalTrendsController(astronautId: string) {
  const zone = useHealthSessionStore((s) => s.trendsZone);
  const openTrends = useHealthSessionStore((s) => s.openTrends);
  const closeTrends = useHealthSessionStore((s) => s.closeTrends);
  const [data, setData] = React.useState<VitalHistoryDto | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!zone) return;
    startTransition(async () => {
      const res = await getVitalHistoryAction({ astronautId, zone, limit: 28 });
      if (res.ok) setData(res.data);
      else toast.error("No se pudo cargar la tendencia", { description: res.error });
    });
  }, [zone, astronautId]);

  const current = data && data.zone === zone && data.astronautId === astronautId ? data : null;
  return { zone, data: current, isPending: isPending || (zone !== null && !current), open: (z: BodyZone) => openTrends(z), close: closeTrends };
}
