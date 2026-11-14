"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/core/presentation/ui/dialog";
import { BODY_ZONE_LABELS, type BodyZone } from "../../../domain/value-objects/body-zone.vo";
import type { VitalHistoryDto } from "../../../application/dto/vital-history.dto";
import { MetricTrendChart } from "./MetricTrendChart";

/** RF-01 trends for one body zone. Pure: data, loading and close handler come from useVitalTrendsController. */
export function VitalTrendsModal({
  zone,
  astronautName,
  gravityLabel,
  data,
  pending,
  onClose,
}: {
  zone: BodyZone | null;
  astronautName: string;
  gravityLabel: string;
  data: VitalHistoryDto | null;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={zone !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tendencia 28 días · {zone ? BODY_ZONE_LABELS[zone] : ""}</DialogTitle>
          <DialogDescription>
            {astronautName}. Umbrales recalculados para {gravityLabel}; las líneas discontinuas marcan precaución y estado crítico.
          </DialogDescription>
        </DialogHeader>
        {pending || !data ? (
          <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-[230px] animate-pulse rounded-lg border bg-muted/30" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.series.map((s) => (
              <MetricTrendChart key={s.key} series={s} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
