"use client";

import * as React from "react";
import { toast } from "sonner";
import type { RegisterAstronautDto } from "../../application/dto/record-measurement.dto";
import { registerAstronautAction, unlinkAstronautAction } from "../actions/telemetry.actions";
import { useHealthSessionStore } from "./useHealthSession.store";

export function useCrewController() {
  const [isPending, startTransition] = React.useTransition();
  const selectAstronaut = useHealthSessionStore((s) => s.selectAstronaut);
  const selectedId = useHealthSessionStore((s) => s.selectedAstronautId);

  const register = React.useCallback(
    (dto: RegisterAstronautDto) =>
      new Promise<{ ok: boolean; fieldErrors?: Record<string, string[]> }>((resolve) => {
        startTransition(async () => {
          const res = await registerAstronautAction(dto);
          if (res.ok) {
            toast.success(`${dto.name} vinculado a la misión`, { description: "Telemetría basal asignada; calibración in vivo en curso." });
            selectAstronaut(res.data.id);
            resolve({ ok: true });
          } else {
            toast.error("No se pudo registrar al tripulante", { description: res.error });
            resolve({ ok: false, fieldErrors: res.fieldErrors });
          }
        });
      }),
    [selectAstronaut]
  );

  const unlink = React.useCallback(
    (astronautId: string, name: string) => {
      startTransition(async () => {
        const res = await unlinkAstronautAction({ astronautId });
        if (res.ok) {
          toast.success(`${name} desvinculado`);
          if (selectedId === astronautId) useHealthSessionStore.setState({ selectedAstronautId: null, selectedStructure: null });
        } else toast.error("No se pudo desvincular", { description: res.error });
      });
    },
    [selectedId]
  );

  return { isPending, register, unlink, selectAstronaut };
}
