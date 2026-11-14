"use client";

import * as React from "react";
import { AudioLines, BrainCircuit, FileText, Link2, ScanEye, UploadCloud, Video, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMission } from "@/components/providers/mission-provider";
import { useToast } from "@/components/providers/toast-provider";
import { CLINICAL_FILES } from "@/lib/data/mock";
import type { ClinicalFile, ClinicalFileKind, OrganId } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const KIND: Record<ClinicalFileKind, { icon: LucideIcon; label: string; organ: OrganId; stages: string[] }> = {
  pdf: { icon: FileText, label: "Documento", organ: "heart", stages: ["Extrayendo texto (OCR)", "Segmentando 12 derivaciones", "Correlacionando con telemetría"] },
  audio: { icon: AudioLines, label: "Audio", organ: "heart", stages: ["Transformada espectral (FFT)", "Clasificando ruidos cardíacos", "Correlacionando con ECG"] },
  video: { icon: Video, label: "Vídeo", organ: "heart", stages: ["Decodificando fotogramas", "Segmentando bordes endocárdicos", "Calculando FEVI"] },
  dicom: { icon: ScanEye, label: "DICOM", organ: "brain", stages: ["Reconstrucción volumétrica", "Midiendo capa de fibras nerviosas", "Estimando PIC"] },
};

function kindFromName(name: string): ClinicalFileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "aac", "ogg", "m4a"].includes(ext)) return "audio";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (["dcm", "dicom", "raw", "png", "jpg", "jpeg"].includes(ext)) return "dicom";
  return "pdf";
}

export function MultimodalAnalyzer() {
  const { selectedCrew, selectOrgan } = useMission();
  const toast = useToast();
  const [files, setFiles] = React.useState<ClinicalFile[]>(CLINICAL_FILES);
  const [activeId, setActiveId] = React.useState(CLINICAL_FILES[3].id);
  const [running, setRunning] = React.useState<{ stage: number; progress: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const active = files.find((f) => f.id === activeId) ?? files[0];

  const analyze = React.useCallback(
    (file: ClinicalFile) => {
      setActiveId(file.id);
      setRunning({ stage: 0, progress: 6 });
      const steps = [
        { stage: 0, progress: 34 },
        { stage: 1, progress: 68 },
        { stage: 2, progress: 100 },
      ];
      steps.forEach((s, i) => setTimeout(() => setRunning(s), 380 * (i + 1)));
      setTimeout(() => {
        setRunning(null);
        toast(`Análisis completado en el dispositivo · ${file.name}`);
      }, 380 * 4);
    },
    [toast]
  );

  const ingest = (list: FileList | null) => {
    if (!list?.length) return;
    const f = list[0];
    const kind = kindFromName(f.name);
    const template = CLINICAL_FILES.find((x) => x.kind === kind)!;
    const now = new Date();
    const file: ClinicalFile = {
      ...template,
      id: `u${now.getTime()}`,
      name: f.name,
      sizeMB: Number((f.size / 1024 / 1024).toFixed(1)) || 0.1,
      capturedAt: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      crewId: selectedCrew.id,
    };
    setFiles((prev) => [file, ...prev]);
    analyze(file);
  };

  const meta = KIND[active.kind];
  const ActiveIcon = meta.icon;

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
                const k = KIND[f.kind];
                const Icon = k.icon;
                const isActive = f.id === active.id;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(f.id)}
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
                          {k.label} · {f.sizeMB} MB · {f.capturedAt} UTC
                        </span>
                      </span>
                      <span className="font-mono text-[11.5px] text-muted-foreground tabular">{f.confidence}%</span>
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
            <Button size="sm" variant="outline" onClick={() => analyze(active)} disabled={!!running}>
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
              <Button
                size="sm"
                onClick={() => {
                  selectOrgan(meta.organ);
                  toast(`Hallazgos acoplados al gemelo digital de ${selectedCrew.shortName}`);
                  document.getElementById("digital-twin")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Link2 /> Acoplar al gemelo digital
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
