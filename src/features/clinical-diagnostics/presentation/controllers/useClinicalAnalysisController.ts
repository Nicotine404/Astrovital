"use client";

import * as React from "react";
import { toast } from "sonner";
import { kindFromFileName, MAX_CLINICAL_FILE_MB } from "../../domain/models/clinical-file.model";
import type { ClinicalFileDto } from "../../application/dto/diagnostics.dto";
import { analyzeClinicalFileAction } from "../actions/diagnostics.actions";

export type AnalysisProgress = { stage: number; progress: number } | null;

const STAGE_MS = 380;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drives the multimodal analyzer: optimistic placeholder for a new study, staged progress
 * while the server action runs the on-device model, and selection of the active study.
 */
export function useClinicalAnalysisController(astronautId: string, files: ClinicalFileDto[]) {
  const [optimisticFiles, addPending] = React.useOptimistic(files, (list, f: ClinicalFileDto) => [f, ...list]);
  const [activeId, setActiveId] = React.useState<string | null>(files[0]?.id ?? null);
  const [progress, setProgress] = React.useState<AnalysisProgress>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => setActiveId((id) => (id && files.some((f) => f.id === id) ? id : (files[0]?.id ?? null))), [files]);

  const animate = React.useCallback(async () => {
    for (const [stage, p] of [
      [0, 34],
      [1, 68],
      [2, 100],
    ] as const) {
      setProgress({ stage, progress: p });
      await wait(STAGE_MS);
    }
  }, []);

  const ingest = React.useCallback(
    (file: File) => {
      if (file.size > MAX_CLINICAL_FILE_MB * 1024 * 1024) {
        toast.error("Archivo demasiado grande", { description: `Máximo ${MAX_CLINICAL_FILE_MB} MB para análisis local.` });
        return;
      }
      const tempId = `pending-${Date.now()}`;
      startTransition(async () => {
        addPending({
          id: tempId,
          astronautId,
          name: file.name,
          kind: kindFromFileName(file.name),
          sizeMb: Math.max(0.1, Math.round((file.size / 1048576) * 10) / 10),
          capturedAt: new Date().toISOString(),
          findings: "Analizando…",
          confidence: 0,
          model: "—",
          latencyMs: 0,
        });
        setActiveId(tempId);
        setProgress({ stage: 0, progress: 6 });
        const [res] = await Promise.all([analyzeClinicalFileAction({ astronautId, fileName: file.name, sizeBytes: file.size }), animate()]);
        setProgress(null);
        if (res.ok) {
          setActiveId(res.data.id);
          toast.success(`Análisis completado en el dispositivo · ${file.name}`);
        } else toast.error("No se pudo analizar el archivo", { description: res.error });
      });
    },
    [astronautId, addPending, animate]
  );

  const reanalyze = React.useCallback(
    (file: ClinicalFileDto) => {
      setActiveId(file.id);
      startTransition(async () => {
        setProgress({ stage: 0, progress: 6 });
        await animate();
        setProgress(null);
        toast.success(`Análisis verificado · ${file.name}`);
      });
    },
    [animate]
  );

  const active = optimisticFiles.find((f) => f.id === activeId) ?? optimisticFiles[0] ?? null;
  return { files: optimisticFiles, active, select: setActiveId, progress, isPending, ingest, reanalyze };
}
