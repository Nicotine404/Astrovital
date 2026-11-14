"use client";

import { Bone, Droplets, Dumbbell, MoveVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { Progress } from "@/core/presentation/ui/progress";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import type { HealthStatus } from "../../../domain/value-objects/health-status.vo";
import type { ClinicalThresholds } from "../../../domain/services/clinical-rules.domain-service";
import type { AstronautSummaryDto, GravityEnvironmentDto } from "../../../application/dto/dashboard-summary.dto";

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

/** RF-04: bone loss, cephalic fluid shift, spinal elongation and the exercise countermeasure. */
export function BoneFluidsCard({ member, thresholds, environment }: { member: AstronautSummaryDto; thresholds: ClinicalThresholds; environment: GravityEnvironmentDto }) {
  const m = member.musculoskeletal;
  const ev = m.evaluation;
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle>Hueso, fluidos y ejercicio</CardTitle>
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
              <Dumbbell className="size-4 text-muted-foreground" /> Ejercicio de contramedida hoy
            </span>
            <span className="font-mono tabular">
              {m.exerciseMinutesToday}/{m.exerciseTargetMinutes} <span className="text-muted-foreground">min</span>
            </span>
          </div>
          <Progress value={Math.min(100, ev.exerciseCompliancePct)} className="mt-2" />
          <p className={cn("mt-1.5 text-[11.5px]", ev.exercise === "NOMINAL" ? "text-muted-foreground" : STATUS_META[ev.exercise].text)}>
            {ev.exercise === "NOMINAL" ? "Ritmo adecuado para el objetivo diario (ARED + cicloergómetro)." : "Por debajo del ritmo esperado para esta hora: reprogramar sesión ARED."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
