"use client";

import * as React from "react";
import { toast } from "sonner";
import type { RecordVitalSignsDto } from "../../application/dto/record-measurement.dto";
import { recordVitalSignsAction } from "../actions/telemetry.actions";

type Form = Omit<RecordVitalSignsDto, "astronautId">;

/** CU-02: manual vital-sign entry; the server evaluates it against the current gravity. */
export function useRecordVitalsController(astronautId: string) {
  const [isPending, startTransition] = React.useTransition();

  const submit = React.useCallback(
    (form: Form) =>
      new Promise<{ ok: boolean; fieldErrors?: Record<string, string[]> }>((resolve) => {
        startTransition(async () => {
          const res = await recordVitalSignsAction({ astronautId, ...form });
          if (!res.ok) {
            toast.error("Medición no registrada", { description: res.error });
            resolve({ ok: false, fieldErrors: res.fieldErrors });
            return;
          }
          const ev = res.data;
          if (ev.overall === "CRITICAL") toast.error("Medición crítica registrada", { description: "Repite la medición en 5 min. Si se confirma, sigue el protocolo y avisa a los médicos de vuelo." });
          else if (ev.overall === "WARNING") toast.warning("Medición registrada · fuera de rango", { description: "Repite la medición en 30 min y revisa la zona en el gemelo digital." });
          else toast.success("Medición registrada · todo en rango");
          resolve({ ok: true });
        });
      }),
    [astronautId]
  );

  return { isPending, submit };
}
