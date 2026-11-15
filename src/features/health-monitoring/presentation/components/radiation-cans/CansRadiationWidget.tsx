"use client";

import { Loader2, Microscope, Radiation, ShieldAlert, Sun } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/core/presentation/ui/alert";
import { Button } from "@/core/presentation/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/presentation/ui/card";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import { RADIATION_LIMITS } from "../../../domain/services/clinical-rules.domain-service";
import type { AstronautSummaryDto } from "../../../application/dto/dashboard-summary.dto";

/** Vertical "tank" gauge: fill = value against a scale, ticks at the action levels. */
function TankGauge({ value, max, warning, critical, label, unit, status }: { value: number; max: number; warning: number; critical: number; label: string; unit: string; status: keyof typeof STATUS_META }) {
  const pct = (v: number) => Math.min(100, (v / max) * 100);
  const meta = STATUS_META[status];
  return (
    <div className="flex items-end gap-3">
      <div className="relative h-36 w-10 overflow-hidden rounded-md border bg-muted/40" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
        <div className={cn("absolute inset-x-0 bottom-0 transition-[height] duration-700", meta.bg)} style={{ height: `${pct(value)}%`, opacity: 0.75 }} />
        {[
          [warning, "var(--caution)"],
          [critical, "var(--critical)"],
        ].map(([v, c]) => (
          <span key={String(v)} className="absolute inset-x-0 h-px" style={{ bottom: `${pct(Number(v))}%`, background: String(c) }} />
        ))}
      </div>
      <div className="space-y-1 pb-0.5">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="font-mono text-[24px] leading-none font-medium tabular">
          {value.toFixed(1)}
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">{unit}</span>
        </p>
        <p className="font-mono text-[10.5px] text-muted-foreground">
          umbral {warning} · crítico {critical}
        </p>
      </div>
    </div>
  );
}

/**
 * RF-02: GCR/SPE dosimetry with the CANS neutron detector. Raises the shelter alert when the
 * domain evaluation requires it. Pure: data and the simulate handler arrive as props.
 */
export function CansRadiationWidget({
  member,
  pending,
  onSimulateSolarEvent,
  onLogBackground,
  compact = false,
}: {
  member: AstronautSummaryDto;
  pending: boolean;
  onSimulateSolarEvent: () => void;
  onLogBackground?: () => void;
  compact?: boolean;
}) {
  const r = member.radiation;
  const ev = r.evaluation;
  const latest = r.latest;
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Radiation className="size-4 text-primary" /> Radiación y neutrones (CANS)
          </CardTitle>
          <p className="text-[13px] text-muted-foreground">Dosímetro del traje de {member.astronaut.shortName} y detector de neutrones del hábitat.</p>
        </div>
        <StatusBadge status={ev.overall} label={ev.shelterRequired ? "Refugio" : undefined} />
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {ev.shelterRequired && (
          <Alert variant="destructive">
            <ShieldAlert />
            <AlertTitle>Refugio obligatorio · evento de partículas solares</AlertTitle>
            <AlertDescription>
              Dirigirse al refugio blindado (tanques de agua y polietileno) hasta que la tasa baje de {RADIATION_LIMITS.doseRate.warning} mSv/día y el flujo
              de neutrones de {RADIATION_LIMITS.neutronFlux.warning}. Al salir, chequeo inmunológico: hemograma y recuento de linfocitos.
            </AlertDescription>
          </Alert>
        )}
        {!ev.shelterRequired && ev.immuneCheckRequired && (
          <Alert variant="destructive">
            <Microscope />
            <AlertTitle>Dosis acumulada cerca del límite · {(ev.careerFraction * 100).toFixed(0)} %</AlertTitle>
            <AlertDescription>Dormir en la zona blindada, evitar EVA y hacer un chequeo inmunológico (hemograma y recuento de linfocitos).</AlertDescription>
          </Alert>
        )}

        <div className={cn("grid gap-5", compact ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
          <TankGauge
            label="Flujo de neutrones"
            unit="n/cm²·s"
            value={latest?.neutronFlux ?? 0}
            max={RADIATION_LIMITS.neutronFlux.critical * 1.4}
            warning={RADIATION_LIMITS.neutronFlux.warning}
            critical={RADIATION_LIMITS.neutronFlux.critical}
            status={ev.neutronFlux}
          />
          <TankGauge
            label="Tasa de dosis"
            unit="mSv/día"
            value={latest?.doseRateMsvDay ?? 0}
            max={RADIATION_LIMITS.doseRate.critical * 1.4}
            warning={RADIATION_LIMITS.doseRate.warning}
            critical={RADIATION_LIMITS.doseRate.critical}
            status={ev.doseRate}
          />
          {!compact && (
            <div className="space-y-2 self-end">
              <p className="text-[12px] text-muted-foreground">Dosis de carrera</p>
              <p className="font-mono text-[24px] leading-none font-medium tabular">
                {r.cumulativeMsv.toFixed(1)}
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">/ {r.careerLimitMsv} mSv</span>
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className={cn("h-full rounded-full", ev.cumulative === "NOMINAL" ? "bg-primary" : STATUS_META[ev.cumulative].bg)} style={{ width: `${Math.min(100, ev.careerFraction * 100)}%` }} />
              </div>
              <p className="text-[11.5px] text-muted-foreground">
                {(ev.careerFraction * 100).toFixed(1)} % del límite · neutrones {r.neutronCumulativeMsv.toFixed(1)} mSv
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-[12px] text-muted-foreground">
            Última lectura {latest ? `${latest.source} · ${new Date(latest.recordedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" })} UTC` : "—"}
          </p>
          <div className="flex gap-2">
            {onLogBackground && (
              <Button size="sm" variant="outline" disabled={pending} onClick={onLogBackground}>
                Registrar GCR diario
              </Button>
            )}
            <Button size="sm" variant="outline" className="border-caution/40 text-caution hover:bg-caution/10 hover:text-caution" disabled={pending} onClick={onSimulateSolarEvent}>
              {pending ? <Loader2 className="animate-spin" /> : <Sun />} Simular evento SPE
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
