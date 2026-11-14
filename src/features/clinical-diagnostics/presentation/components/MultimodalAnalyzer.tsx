"use client";

import * as React from "react";
import { AudioLines, BrainCircuit, FileText, Link2, ScanEye, UploadCloud, Video, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { Button } from "@/core/presentation/ui/button";
import { Badge } from "@/core/presentation/ui/badge";
import { Progress } from "@/core/presentation/ui/progress";
import { cn } from "@/core/utils/cn";
import { ANALYSIS_PIPELINES, type ClinicalFileKind } from "../../domain/models/clinical-file.model";
import type { ClinicalFileDto } from "../../application/dto/diagnostics.dto";

const ICONS: Record<ClinicalFileKind, LucideIcon> = { pdf: FileText, audio: AudioLines, video: Video, dicom: ScanEye };
const time = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

/** Pure view of the on-device multimodal analysis. State lives in useClinicalAnalysisController. */
export function MultimodalAnalyzer({
  files,
  active,
  running,
  busy,
  onSelect,
  onIngest,
  onReanalyze,
  onCouple,
}: {
  files: ClinicalFileDto[];
  active: ClinicalFileDto | null;
  running: { stage: number; progress: number } | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onIngest: (file: File) => void;
  onReanalyze: (file: ClinicalFileDto) => void;
  /** Couples the active finding to the twin (structure from the modality pipeline). */
  onCouple?: (file: ClinicalFileDto) => void;
}) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ingest = (list: FileList | null) => {
    if (list?.[0]) onIngest(list[0]);
  };

  if (!active) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Sin estudios clínicos para este tripulante.
          <div className="mt-4">
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <UploadCloud /> Subir estudio
            </Button>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => ingest(e.target.files)} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const meta = ANALYSIS_PIPELINES[active.kind];
  const ActiveIcon = ICONS[active.kind];

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle>Análisis clínico multimodal</CardTitle>
            <Badge variant="outline" className="font-mono">v4.2</Badge>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Documentos, audio, vídeo e imagen médica analizados íntegramente en el dispositivo, sin enlace terrestre.
          </p>
        </div>
        <Badge variant="nominal">
          <BrainCircuit /> WebGPU · local
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-5 pt-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Intake */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              ingest(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              dragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-accent/40"
            )}
          >
            <span className="grid size-10 place-items-center rounded-full border bg-muted">
              <UploadCloud className="size-5 text-primary" />
            </span>
            <span className="text-sm font-medium">Arrastra archivos clínicos o haz clic para examinar</span>
            <span className="text-[12.5px] text-muted-foreground">PDF · WAV/MP3 · MP4 · DICOM — se cifran y guardan en local</span>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.mp3,.wav,.mp4,.webm,.dcm,.png,.jpg,.csv"
              onChange={(e) => ingest(e.target.files)}
            />
          </button>

          <div>
            <p className="eyebrow mb-2">Archivos en memoria local · {files.length}</p>
            <ul className="divide-y rounded-lg border">
              {files.map((f) => {
                const k = ANALYSIS_PIPELINES[f.kind];
                const Icon = ICONS[f.kind];
                const isActive = f.id === active.id;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(f.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer outline-none focus-visible:bg-accent",
                        isActive ? "bg-accent/70" : "hover:bg-accent/40"
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{f.name}</span>
                        <span className="block text-[11.5px] text-muted-foreground">
                          {k.label} · {f.sizeMb} MB · {time(f.capturedAt)} UTC
                        </span>
                      </span>
                      <span className="font-mono text-[11.5px] text-muted-foreground tabular">{f.confidence ? `${f.confidence}%` : "…"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col rounded-lg border bg-muted/20">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <ActiveIcon className="size-4 shrink-0 text-primary" />
              <span className="truncate text-[13.5px] font-medium">{active.name}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => onReanalyze(active)} disabled={busy}>
              {running ? "Analizando…" : "Reanalizar"}
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-muted-foreground">
                  {running ? meta.stages[running.stage] : `Modelo: ${active.model}`}
                </span>
                <span className="font-mono tabular">{running ? `${running.progress}%` : `Confianza ${active.confidence}%`}</span>
              </div>
              <Progress value={running ? running.progress : active.confidence} />
            </div>

            <ol className="grid grid-cols-3 gap-2">
              {meta.stages.map((s, i) => {
                const done = !running || running.stage > i || running.progress === 100;
                const current = running?.stage === i && running.progress < 100;
                return (
                  <li
                    key={s}
                    className={cn(
                      "rounded-md border px-2.5 py-2 text-[11.5px] leading-snug transition-colors",
                      current ? "border-primary/50 text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    <span className="mb-0.5 block font-mono text-[10.5px]">{String(i + 1).padStart(2, "0")}</span>
                    {s}
                  </li>
                );
              })}
            </ol>

            <div className={cn("rounded-md border bg-card p-4 transition-opacity", running && "opacity-40")}>
              <p className="eyebrow mb-2">Síntesis clínica</p>
              <p className="text-[13.5px] leading-relaxed text-pretty">{active.findings}</p>
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="font-mono text-[11.5px] text-muted-foreground">
                Latencia {active.latencyMs} ms · 384 MB VRAM
              </span>
              {onCouple && (
                <Button size="sm" disabled={busy} onClick={() => onCouple(active)}>
                  <Link2 /> Acoplar al gemelo digital
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
