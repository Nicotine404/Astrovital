import type { Metadata } from "next";
import { Cpu, FileCheck2, Timer, Waypoints } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DIAGNOSES, CREW } from "@/lib/data/mock";

export const metadata: Metadata = { title: "Diagnóstico IA" };

const STATS = [
  { icon: Cpu, label: "Modelo local", value: "MedLLM-Mars 4-bit", sub: "WebGPU + WASM" },
  { icon: Timer, label: "Latencia media", value: "18 ms", sub: "p95 · 41 ms" },
  { icon: FileCheck2, label: "Fuentes correlacionadas", value: "4 archivos", sub: "PDF · audio · vídeo · DICOM" },
  { icon: Waypoints, label: "Revisión terrestre", value: "Pendiente", sub: "Próxima ventana DSN 14m 22s" },
];

export default function DiagnosticsPage() {
  const crew = CREW.find((c) => c.id === DIAGNOSES[0].crewId)!;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnóstico autónomo · Vesta 4.2"
        title="Inferencia clínica en el dispositivo"
        description={`Hipótesis diagnósticas para ${crew.name}, generadas sin conexión a partir de telemetría y estudios multimodales. Requieren validación del oficial médico.`}
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

      <div className="space-y-4">
        {DIAGNOSES.map((d, idx) => (
          <Card key={d.id}>
            <CardHeader className="border-b">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {idx === 0 ? "Primario" : `Secundario ${idx}`}
                  </Badge>
                  <StatusBadge status={d.status} />
                </div>
                <CardTitle className="text-[16px]">{d.title}</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-muted-foreground">Probabilidad</p>
                <p className="font-mono text-[24px] leading-tight font-medium tabular">
                  {d.probability}
                  <span className="text-[13px] text-muted-foreground">%</span>
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="space-y-4">
                <p className="text-[13.5px] leading-relaxed text-muted-foreground text-pretty">{d.summary}</p>
                <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
                  {d.evidence.map((e) => (
                    <div key={e.label} className="bg-card px-3 py-2.5">
                      <dt className="text-[11.5px] text-muted-foreground">{e.label}</dt>
                      <dd className="mt-0.5 font-mono text-[14px] tabular">{e.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-3.5">
                  <p className="eyebrow !text-primary">Recomendación</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed">{d.recommendation}</p>
                </div>
              </div>

              <figure>
                <figcaption className="eyebrow mb-3">Diagnóstico diferencial</figcaption>
                <ul className="space-y-3">
                  {d.differentials.map((x, i) => (
                    <li key={x.label} title={`${x.label}: ${x.probability} %`}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                        <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{x.label}</span>
                        <span className="font-mono text-[12.5px] tabular">{x.probability}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(x.probability, 1.5)}%`,
                            background: i === 0 ? "var(--primary)" : "color-mix(in oklab, var(--primary) 40%, var(--secondary))",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </figure>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
