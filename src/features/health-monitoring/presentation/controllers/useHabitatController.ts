"use client";

import * as React from "react";
import { toast } from "sonner";
import type { HabitatId } from "../../domain/value-objects/habitat.vo";
import type { HabitatDto } from "../../application/dto/dashboard-summary.dto";
import { changeHabitatAction } from "../actions/telemetry.actions";

/**
 * CU-04. The selector moves instantly (useOptimistic) while the server recalibrates thresholds
 * and routines for the new place; the revalidated layout then delivers the new statuses.
 */
export function useHabitatController(current: HabitatDto, habitats: HabitatDto[]) {
  const [optimistic, setOptimistic] = React.useOptimistic(current, (_, next: HabitatDto) => next);
  const [isPending, startTransition] = React.useTransition();

  const change = React.useCallback(
    (id: HabitatId) => {
      const next = habitats.find((h) => h.id === id);
      if (!next || id === optimistic.id) return;
      startTransition(async () => {
        setOptimistic(next);
        const res = await changeHabitatAction({ habitatId: id });
        if (res.ok)
          toast.success(`${res.data.label} · ${res.data.gravity.label}`, {
            description: res.data.hasResistanceDevice
              ? "Umbrales clínicos, blindaje y rutina de ejercicio recalculados."
              : "Umbrales y blindaje recalculados. Sin máquina de resistencia: la rutina usa bandas elásticas.",
          });
        else toast.error("No se pudo cambiar de lugar", { description: res.error });
      });
    },
    [habitats, optimistic.id, setOptimistic]
  );

  return { habitat: optimistic, habitats, isPending, change };
}
