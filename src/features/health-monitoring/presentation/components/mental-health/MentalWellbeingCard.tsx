"use client";

import * as React from "react";
import { Loader2, Moon, Smile, Zap } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { Label } from "@/core/presentation/ui/label";
import { Slider } from "@/core/presentation/ui/slider";
import { Sparkline } from "@/core/presentation/shared/Sparkline";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import type { MentalCheckin } from "../../../domain/models/mental-health.model";
import type { MentalEvaluation } from "../../../domain/services/clinical-rules.domain-service";

function Field({ id, icon: Icon, label, value, display, min, max, step, onChange }: { id: string; icon: React.ElementType; label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-normal">
          <Icon className="size-3.5 text-muted-foreground" /> {label}
        </Label>
        <span className="font-mono text-[13px] tabular">{display}</span>
      </div>
      <Slider id={id} min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}

/** RF-05: sleep, stress and mood. Pure: history, evaluation and submit handler arrive as props. */
export function MentalWellbeingCard({
  history,
  evaluation,
  pending,
  onSubmit,
}: {
  history: MentalCheckin[];
  evaluation: MentalEvaluation;
  pending: boolean;
  onSubmit: (form: { sleepHours: number; stressLevel: number; mood: number; notes?: string }) => void;
}) {
  const latest = history.at(-1);
  const [sleep, setSleep] = React.useState(latest?.sleepHours ?? 7);
  const [stress, setStress] = React.useState(latest?.stressLevel ?? 4);
  const [mood, setMood] = React.useState(latest?.mood ?? 7);
  const [notes, setNotes] = React.useState("");

  const trend = [
    { label: "Sueño", unit: "h", data: history.map((h) => h.sleepHours), status: evaluation.sleep, band: [7, 9] as [number, number] },
    { label: "Estrés", unit: "/10", data: history.map((h) => h.stressLevel), status: evaluation.stress, band: [1, 6] as [number, number] },
    { label: "Ánimo", unit: "/10", data: history.map((h) => h.mood), status: evaluation.mood, band: [5, 10] as [number, number] },
  ];

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Salud mental</CardTitle>
          <p className="text-[13px] text-muted-foreground">Check-in diario confidencial · últimos {history.length} días</p>
        </div>
        <StatusBadge status={evaluation.overall} />
      </CardHeader>
      <CardContent className="grid gap-6 pt-5 lg:grid-cols-2">
        <div className="space-y-4">
          {evaluation.alerts.length > 0 && (
            <ul className={cn("space-y-1.5 rounded-md border px-3 py-2.5 text-[12.5px]", evaluation.trend === "CRITICAL" ? "border-critical/30 bg-critical/5 text-critical" : "border-caution/30 bg-caution/5 text-caution")}>
              {evaluation.alerts.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          {trend.map((t) => (
            <div key={t.label}>
              <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                <span className="text-muted-foreground">{t.label}</span>
                <span className={cn("font-mono tabular", t.status !== "NOMINAL" && STATUS_META[t.status].text)}>
                  {t.data.at(-1)?.toFixed(t.unit === "h" ? 1 : 0) ?? "—"}
                  <span className="ml-0.5 text-[11px] text-muted-foreground">{t.unit}</span>
                </span>
              </div>
              {t.data.length > 1 ? <Sparkline data={t.data} unit={t.unit} band={t.band} xStep={1} xUnit="d" color={t.status === "NOMINAL" ? "var(--primary)" : STATUS_META[t.status].cssVar} /> : <div className="h-8 rounded bg-muted/40" />}
            </div>
          ))}
        </div>

        <form
          className="space-y-4 rounded-lg border bg-muted/20 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ sleepHours: sleep, stressLevel: stress, mood, notes: notes.trim() || undefined });
            setNotes("");
          }}
        >
          <p className="eyebrow">Nuevo check-in</p>
          <Field id="sleep" icon={Moon} label="Horas de sueño" value={sleep} display={`${sleep.toFixed(1)} h`} min={0} max={14} step={0.5} onChange={setSleep} />
          <Field id="stress" icon={Zap} label="Nivel de estrés" value={stress} display={`${stress}/10`} min={1} max={10} step={1} onChange={setStress} />
          <Field id="mood" icon={Smile} label="Estado de ánimo" value={mood} display={`${mood}/10`} min={1} max={10} step={1} onChange={setMood} />
          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-[13px] font-normal">
              Notas (opcional)
            </Label>
            <textarea
              id="notes"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-md border bg-input/30 px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="Conflictos, fatiga, aislamiento…"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} Registrar check-in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
