import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { Badge } from "@/core/presentation/ui/badge";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import type { DiagnosisDto } from "../../application/dto/diagnostics.dto";

/** Ranked diagnostic hypotheses (primary first). Pure, server-renderable. */
export function DiagnosisList({ diagnoses }: { diagnoses: DiagnosisDto[] }) {
  if (!diagnoses.length) {
    return <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Sin hipótesis diagnósticas activas para este tripulante.</div>;
  }
  return (
    <div className="space-y-4">
        {diagnoses.map((d, idx) => (
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
  );
}
