"use client";

import * as React from "react";
import { Bone, Check, Droplets, Dumbbell, Eye, Loader2, MoveVertical, Plus, RotateCw } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { Progress } from "@/core/presentation/ui/progress";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import { SYMPTOM_SEVERITY_LABELS, type SymptomSeverity } from "../../../domain/models/musculoskeletal.model";
import type { HealthStatus } from "../../../domain/value-objects/health-status.vo";
import type { ClinicalThresholds } from "../../../domain/services/clinical-rules.domain-service";
import type { AstronautSummaryDto, GravityEnvironmentDto } from "../../../application/dto/dashboard-summary.dto";
import { IndicatorHelp } from "../help/IndicatorHelp";

function Row({ icon: Icon, label, value, unit, status, detail }: { icon: React.ElementType; label: string; value: string; unit: string; status: HealthStatus; detail: string }) {
  const meta = STATUS_META[status];
  const SIcon = meta.icon;
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px]">{label}</p>
          <SIcon className={cn("size-3.5", meta.text)} aria-label={meta.label} />
        </div>
        <p className="font-mono text-[18px] leading-tight font-medium tabular">
          {value}
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">{unit}</span>
        </p>
        <p className="text-[11.5px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

/** 0–3 segmented scale for a self-reported symptom. */
function SeverityScale({ id, label, hint, value, onChange }: { id: string; label: string; hint: string; value: SymptomSeverity; onChange: (v: SymptomSeverity) => void }) {
  return (
    <div className="grid gap-1.5">
      <p id={id} className="text-[12.5px]">
        {label} <span className="text-muted-foreground">· {hint}</span>
      </p>
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-4 gap-1 rounded-md border bg-muted/40 p-0.5">
        {SYMPTOM_SEVERITY_LABELS.map((l, i) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={value === i}
            onClick={() => onChange(i as SymptomSeverity)}
            className={cn(
              "h-7 cursor-pointer rounded text-[11.5px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              value === i ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * RF-04 / CU-05: bone loss, cephalic fluid shift, spinal elongation, the gravity-dependent exercise
 * routine and the vision / dizziness self-report. Pure: data and handlers arrive as props; without
 * handlers it renders read-only (overview).
 */
export function BoneFluidsCard({
  member,
  thresholds,
  environment,
  pending = false,
  onLogExercise,
  onReportSymptoms,
}: {
  member: AstronautSummaryDto;
  thresholds: ClinicalThresholds;
  environment: GravityEnvironmentDto;
  pending?: boolean;
  onLogExercise?: (minutes: number, label: string) => void;
  onReportSymptoms?: (report: { vision: SymptomSeverity; dizziness: SymptomSeverity }) => void;
}) {
  const m = member.musculoskeletal;
  const ev = m.evaluation;
  const [vision, setVision] = React.useState<SymptomSeverity>(m.visionSymptom);
  const [dizziness, setDizziness] = React.useState<SymptomSeverity>(m.dizzinessSymptom);
  const symptomsStatus: HealthStatus = ev.vision === "CRITICAL" || ev.dizziness === "CRITICAL" ? "CRITICAL" : ev.vision !== "NOMINAL" || ev.dizziness !== "NOMINAL" ? "WARNING" : "NOMINAL";

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-1.5">
            Hueso, fluidos y ejercicio <IndicatorHelp id="boneFluids" />
          </CardTitle>
          <p className="text-[13px] text-muted-foreground">
            Referencias para {environment.location} ({environment.label}): pérdida ósea esperada {thresholds.boneLossPerMonthPct} %/mes.
          </p>
        </div>
        <StatusBadge status={ev.overall} />
      </CardHeader>
      <CardContent className="divide-y pt-2">
        <Row
          icon={Bone}
          label="Densidad mineral ósea"
          value={`${m.boneDensityDeltaPct.toFixed(2)}`}
          unit="% Δ"
          status={ev.boneDensity}
          detail={`Proyección a 30 días ${ev.projectedBoneDeltaPct.toFixed(2)} % · umbral ${thresholds.boneWarningPct} %`}
        />
        <Row
          icon={Droplets}
          label="Desplazamiento cefálico de fluidos"
          value={`+${m.cephalicFluidShiftMmHg.toFixed(0)}`}
          unit="mmHg"
          status={ev.fluidShift}
          detail={`Esperado ${thresholds.expectedFluidShiftMmHg} ± ${thresholds.fluidShiftToleranceMmHg} mmHg en este entorno`}
        />
        <Row
          icon={MoveVertical}
          label="Elongación espinal"
          value={`+${m.spinalElongationCm.toFixed(1)}`}
          unit="cm"
          status="NOMINAL"
          detail={`Esperada ≈ ${thresholds.expectedSpinalElongationCm} cm · masa muscular ${m.muscleMassDeltaPct.toFixed(1)} %`}
        />

        <div className="py-3">
          <div className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex items-center gap-2">
              <Dumbbell className="size-4 text-muted-foreground" /> Rutina obligatoria en {environment.location}
            </span>
            <span className="font-mono tabular">
              {m.exerciseMinutesToday}/{ev.exerciseTargetMinutes} <span className="text-muted-foreground">min</span>
            </span>
          </div>
          <Progress value={Math.min(100, ev.exerciseCompliancePct)} className="mt-2" />
          <p className={cn("mt-1.5 text-[11.5px]", ev.exercise === "NOMINAL" ? "text-muted-foreground" : STATUS_META[ev.exercise].text)}>
            {ev.exercise === "NOMINAL" ? "Ritmo adecuado para el objetivo diario." : "Por debajo del ritmo esperado para esta hora: reprograma la siguiente sesión."}
          </p>
          <ul className="mt-3 space-y-1.5">
            {ev.routine.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[12.5px]">
                    {r.label} <span className="font-mono text-muted-foreground tabular">· {r.minutes} min</span>
                  </p>
                  <p className="truncate text-[11.5px] text-muted-foreground">{r.purpose}</p>
                </div>
                {onLogExercise && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => onLogExercise(r.minutes, r.label)} aria-label={`Registrar ${r.label}, ${r.minutes} minutos`}>
                    {pending ? <Loader2 className="animate-spin" /> : <Plus />} Hecho
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 py-3">
          <div className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex items-center gap-2">
              <Eye className="size-4 text-muted-foreground" /> Síntomas de visión y equilibrio <IndicatorHelp id="symptoms" />
            </span>
            <StatusBadge status={symptomsStatus} />
          </div>
          {onReportSymptoms ? (
            <>
              <SeverityScale id="vision-scale" label="Visión borrosa" hint="lee una línea de texto a 40 cm con cada ojo" value={vision} onChange={setVision} />
              <SeverityScale id="dizziness-scale" label="Mareo o desequilibrio" hint="de pie, ojos cerrados, 30 s" value={dizziness} onChange={setDizziness} />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11.5px] text-muted-foreground">
                  {m.symptomsRecordedAt ? `Último reporte ${new Date(m.symptomsRecordedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" })} UTC` : "Sin reportes todavía"}
                </p>
                <Button size="sm" disabled={pending} onClick={() => onReportSymptoms({ vision, dizziness })}>
                  {pending ? <Loader2 className="animate-spin" /> : vision === 0 && dizziness === 0 ? <Check /> : <RotateCw />} Reportar
                </Button>
              </div>
            </>
          ) : (
            <p className="text-[11.5px] text-muted-foreground">
              Visión: {SYMPTOM_SEVERITY_LABELS[m.visionSymptom].toLowerCase()} · Mareo: {SYMPTOM_SEVERITY_LABELS[m.dizzinessSymptom].toLowerCase()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
