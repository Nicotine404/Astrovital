import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoseChart } from "@/components/radiation/dose-chart";
import { CREW, DOSE_HISTORY } from "@/lib/data/mock";

export const metadata: Metadata = { title: "Dosimetría" };

const LIMIT = 600; // career reference limit, mSv

export default function RadiationPage() {
  const latest = DOSE_HISTORY[DOSE_HISTORY.length - 1];
  const maxCrew = Math.max(...CREW.map((c) => c.vitals.radiationMSv));
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dosimetría · GCR y SPE"
        title="Radiación espacial"
        description="Exposición acumulada a rayos cósmicos galácticos y eventos de partículas solares, comparada con el límite de carrera de referencia."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tasa GCR actual", value: "0.41", unit: "mSv/día", status: "nominal" as const, note: "Dentro de margen para tránsito" },
          { label: "Dosis de misión", value: latest.cumulative.toFixed(0), unit: "mSv", status: "nominal" as const, note: `${((latest.cumulative / LIMIT) * 100).toFixed(0)} % del límite de carrera` },
          { label: "Blindaje del hábitat", value: "100", unit: "%", status: "nominal" as const, note: "Agua y polietileno perimetral" },
          { label: "Alerta SPE", value: "Quieta", unit: "", status: "nominal" as const, note: "Sin CME en trayectoria de intercepción" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] text-muted-foreground">{s.label}</p>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-2 font-mono text-[24px] font-medium tabular">
              {s.value}
              <span className="ml-1 text-[12px] font-normal text-muted-foreground">{s.unit}</span>
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dosis acumulada de la misión</CardTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">mSv por sol desde el lanzamiento · promedio de tripulación</p>
            </div>
          </CardHeader>
          <CardContent>
            <DoseChart data={DOSE_HISTORY} event={{ sol: 150, label: "Evento SPE · refugio 18 h" }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Exposición por tripulante</CardTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">Dosímetro personal del traje</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {CREW.map((c) => (
              <div key={c.id}>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span>{c.name}</span>
                  <span className="font-mono tabular">
                    {c.vitals.radiationMSv.toFixed(1)} <span className="text-muted-foreground">mSv</span>
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(c.vitals.radiationMSv / LIMIT) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="border-t pt-3 text-[12px] text-muted-foreground">
              Escala: 0 – {LIMIT} mSv (límite de carrera de referencia). Máximo actual {maxCrew.toFixed(0)} mSv.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
