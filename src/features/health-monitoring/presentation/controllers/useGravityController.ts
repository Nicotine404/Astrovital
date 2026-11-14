"use client";

import * as React from "react";
import { toast } from "sonner";
import type { GravityEnvironmentId } from "../../domain/value-objects/gravity-environment.vo";
import type { GravityEnvironmentDto } from "../../application/dto/dashboard-summary.dto";
import { changeGravityEnvironmentAction } from "../actions/telemetry.actions";

/**
 * RF-03. The selector moves instantly (useOptimistic) while the server recalibrates every
 * clinical threshold; the revalidated layout then delivers the recalculated statuses.
 */
export function useGravityController(current: GravityEnvironmentDto, environments: GravityEnvironmentDto[]) {
  const [optimistic, setOptimistic] = React.useOptimistic(current, (_, next: GravityEnvironmentDto) => next);
  const [isPending, startTransition] = React.useTransition();

  const change = React.useCallback(
    (id: GravityEnvironmentId) => {
      const next = environments.find((e) => e.id === id);
      if (!next || id === optimistic.id) return;
      startTransition(async () => {
        setOptimistic(next);
        const res = await changeGravityEnvironmentAction({ environmentId: id });
        if (res.ok) toast.success(`Entorno ${res.data.location} · ${res.data.label}`, { description: "Umbrales clínicos recalculados para toda la tripulación." });
        else toast.error("No se pudo cambiar el entorno", { description: res.error });
      });
    },
    [environments, optimistic.id, setOptimistic]
  );

  return { environment: optimistic, environments, isPending, change };
}
