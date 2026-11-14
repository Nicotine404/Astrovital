"use client";

import * as React from "react";
import { toast } from "sonner";
import { logRadiationExposureAction } from "../actions/telemetry.actions";

/** RF-02: dosimetry actions. A simulated SPE hits the whole crew and may require shelter. */
export function useRadiationController() {
  const [isPending, startTransition] = React.useTransition();

  const simulateSolarEvent = React.useCallback(() => {
    startTransition(async () => {
      const res = await logRadiationExposureAction({ source: "SPE", doseRateMsvDay: 6.4, neutronFlux: 9.2, durationHours: 3 });
      if (!res.ok) {
        toast.error("No se pudo registrar el evento", { description: res.error });
        return;
      }
      if (res.data.shelterRequired) {
        toast.error("Evento de partículas solares · refugio obligatorio", {
          description: "Tripulación al refugio blindado (tanques de agua). Detector CANS de neutrones por encima del umbral.",
          duration: 9000,
        });
      } else toast.warning("Evento SPE registrado", { description: "Dosis añadida a todos los dosímetros." });
    });
  }, []);

  const logBackground = React.useCallback(() => {
    startTransition(async () => {
      const res = await logRadiationExposureAction({ source: "GCR", doseRateMsvDay: 0.42, neutronFlux: 0.9, durationHours: 24 });
      if (res.ok) toast.success("Lectura GCR diaria registrada");
      else toast.error("No se pudo registrar la lectura", { description: res.error });
    });
  }, []);

  return { isPending, simulateSolarEvent, logBackground };
}
