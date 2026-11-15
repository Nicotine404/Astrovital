"use client";

import * as React from "react";
import { toast } from "sonner";
import type { SymptomSeverity } from "../../domain/models/musculoskeletal.model";
import { logExerciseAction, reportSymptomsAction } from "../actions/telemetry.actions";

/** CU-05: countermeasure sessions and vision / dizziness self-reports. */
export function usePhysicalController(astronautId: string) {
  const [isPending, startTransition] = React.useTransition();

  const logExercise = React.useCallback(
    (minutes: number, label: string) => {
      startTransition(async () => {
        const res = await logExerciseAction({ astronautId, minutes });
        if (!res.ok) toast.error("Sesión no registrada", { description: res.error });
        else if (res.data.exerciseCompliancePct >= 100) toast.success(`${label} registrado`, { description: "Rutina diaria completa." });
        else toast.success(`${label} registrado`, { description: `${res.data.exerciseCompliancePct} % de la rutina de hoy.` });
      });
    },
    [astronautId]
  );

  const reportSymptoms = React.useCallback(
    (report: { vision: SymptomSeverity; dizziness: SymptomSeverity }) => {
      startTransition(async () => {
        const res = await reportSymptomsAction({ astronautId, ...report });
        if (!res.ok) toast.error("Reporte no registrado", { description: res.error });
        else if (res.data.vision === "CRITICAL" || res.data.dizziness === "CRITICAL")
          toast.error("Síntoma severo registrado", { description: "Detén tareas de riesgo y contacta con los médicos de vuelo en la próxima ventana de comunicación." });
        else if (res.data.vision !== "NOMINAL" || res.data.dizziness !== "NOMINAL") toast.warning("Síntoma registrado", { description: "Repite el reporte en 12 h para ver si evoluciona." });
        else toast.success("Sin síntomas registrados");
      });
    },
    [astronautId]
  );

  return { isPending, logExercise, reportSymptoms };
}
