"use client";

import * as React from "react";
import { toast } from "sonner";
import type { MentalCheckin } from "../../domain/models/mental-health.model";
import { logMentalCheckinAction } from "../actions/telemetry.actions";

export interface CheckinForm {
  sleepHours: number;
  stressLevel: number;
  mood: number;
  notes?: string;
}

/** RF-05: daily psychological check-in, shown immediately (useOptimistic) while it is stored. */
export function useWellbeingController(astronautId: string, history: MentalCheckin[]) {
  const [optimisticHistory, addOptimistic] = React.useOptimistic(history, (list, entry: MentalCheckin) => [...list, entry].slice(-14));
  const [isPending, startTransition] = React.useTransition();

  const submit = React.useCallback(
    (form: CheckinForm) => {
      startTransition(async () => {
        addOptimistic({ ...form, recordedAt: new Date().toISOString() });
        const res = await logMentalCheckinAction({ astronautId, ...form });
        if (!res.ok) toast.error("Check-in no registrado", { description: res.error });
        else if (res.data.overall === "NOMINAL") toast.success("Check-in registrado");
        else toast.warning("Check-in registrado · seguimiento recomendado", { description: "Se notificará al oficial médico en la próxima ventana DSN." });
      });
    },
    [astronautId, addOptimistic]
  );

  return { history: optimisticHistory, latest: optimisticHistory.at(-1) ?? null, isPending, submit };
}
