import type { Metadata } from "next";
import { Cpu, FileCheck2, Timer, Waypoints } from "lucide-react";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { PageHeader } from "@/core/presentation/shared/PageHeader";
import { DiagnosticsView } from "@/features/clinical-diagnostics/presentation/views/DiagnosticsView";

export const metadata: Metadata = { title: "Diagnóstico IA" };

export default async function DiagnosticsPage() {
  const { healthMonitoring, clinicalDiagnostics } = await createServerContainer();
  const summary = await healthMonitoring.getAstronautTelemetry.execute();
  const diagnostics = await Promise.all(summary.crew.map((c) => clinicalDiagnostics.getDiagnostics.execute(c.astronaut.id)));
  const files = diagnostics.reduce((n, d) => n + d.files.length, 0);
  const STATS = [
    { icon: Cpu, label: "Modelo local", value: "MedLLM-Mars 4-bit", sub: "WebGPU + WASM" },
    { icon: Timer, label: "Latencia media", value: "18 ms", sub: "p95 · 41 ms" },
    { icon: FileCheck2, label: "Fuentes correlacionadas", value: `${files} archivos`, sub: "PDF · audio · vídeo · DICOM" },
    { icon: Waypoints, label: "Revisión terrestre", value: "Pendiente", sub: `Retardo ${summary.environment.commDelay}` },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnóstico autónomo · Vesta 4.2"
        title="Inferencia clínica en el dispositivo"
        description="Hipótesis diagnósticas generadas sin conexión a partir de telemetría y estudios multimodales."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <s.icon className="size-3.5" /> {s.label}
            </p>
            <p className="mt-2 text-[17px] font-medium tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <DiagnosticsView crew={summary.crew} byAstronaut={Object.fromEntries(diagnostics.map((d) => [d.astronautId, d]))} />
    </div>
  );
}
