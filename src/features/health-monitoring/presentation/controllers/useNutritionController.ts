"use client";

import * as React from "react";
import { toast } from "sonner";
import { addIntake as addToLog, type NutritionIntake, type NutritionLog } from "../../domain/models/nutrition-log.model";
import { logNutritionIntakeAction } from "../actions/nutrition.actions";

/** RF-06: intake logging with optimistic totals; the server validates against daily targets. */
export function useNutritionController(astronautId: string, log: NutritionLog) {
  const [optimisticLog, addOptimistic] = React.useOptimistic(log, (current, intake: NutritionIntake) => addToLog(current, intake));

  const [isPending, startTransition] = React.useTransition();

  const addIntake = React.useCallback(
    (intake: NutritionIntake, label: string) => {
      startTransition(async () => {
        addOptimistic(intake);
        const res = await logNutritionIntakeAction({ astronautId, ...intake });
        if (!res.ok) toast.error("Ingesta no registrada", { description: res.error });
        else if (res.data.alerts.length) toast.warning(`${label} registrado`, { description: res.data.alerts[0] });
        else toast.success(`${label} registrado`);
      });
    },
    [astronautId, addOptimistic]
  );

  return { log: optimisticLog, isPending, addIntake };
}
