"use client";

import { Activity, Brain, Droplets, Gauge, HeartPulse, LineChart, Thermometer } from "lucide-react";
import { Sparkline } from "@/core/presentation/shared/Sparkline";
import { STATUS_META } from "@/core/presentation/shared/status-meta";
import { cn } from "@/core/utils/cn";
import type { VitalSigns } from "../../../domain/models/vital-signs.model";
import type { BodyZone } from "../../../domain/value-objects/body-zone.vo";
import type { HealthStatus } from "../../../domain/value-objects/health-status.vo";
import type { ClinicalThresholds, VitalsEvaluation } from "../../../domain/services/clinical-rules.domain-service";

type Series = Record<Exclude<keyof VitalSigns, "recordedAt">, number[]>;

function Tile({
  icon: Icon,
  label,
  value,
  unit,
  data,
  band,
  status,
  caption,
  zone,
  onOpenTrends,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  data: number[];
  band?: [number, number];
  status: HealthStatus;
  caption: string;
  zone: BodyZone;
  onOpenTrends: (zone: BodyZone) => void;
}) {
  const meta = STATUS_META[status];
  const SIcon = meta.icon;
  return (
    <div className={cn("group relative flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-3.5", status !== "NOMINAL" && "border-caution/30", status === "CRITICAL" && "border-critical/40")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <SIcon className={`size-3.5 ${meta.text}`} aria-label={meta.label} />
      </div>
      <p className="font-mono text-[22px] leading-none font-medium tracking-tight tabular">
        {value}
        <span className="ml-1 text-[12px] font-normal text-muted-foreground">{unit}</span>
      </p>
      <Sparkline data={data} band={band} unit={unit} color={status === "NOMINAL" ? "var(--primary)" : meta.cssVar} />
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11.5px] text-muted-foreground">{caption}</p>
        <button
          type="button"
          onClick={() => onOpenTrends(zone)}
          className="inline-flex shrink-0 items-center gap-1 rounded px-1 text-[11px] text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
          aria-label={`Tendencia 28 días · ${label}`}
        >
          <LineChart className="size-3" /> 28 d
        </button>
      </div>
    </div>
  );
}

/** Live vitals for the selected astronaut. Pure: samples and evaluations arrive as props. */
export function VitalsStrip({
  latest,
  series,
  evaluation,
  thresholds,
  source,
  onOpenTrends,
  action,
}: {
  action?: React.ReactNode;
  latest: VitalSigns;
  series: Series;
  evaluation: VitalsEvaluation;
  thresholds: ClinicalThresholds;
  source: "supabase" | "simulated";
  onOpenTrends: (zone: BodyZone) => void;
}) {
  return (
    <section aria-label="Signos vitales en vivo" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight">Signos vitales en vivo</h2>
        <div className="flex items-center gap-3">
        {action}
        <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-nominal opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-nominal" />
          </span>
          {source === "supabase" ? "Supabase Realtime" : "Telemetría simulada"} · 1.5 s
        </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <Tile icon={HeartPulse} label="Frecuencia cardíaca" value={Math.round(latest.heartRate).toString()} unit="lpm" data={series.heartRate} band={[50, 100]} status={evaluation.heartRate} caption="Ritmo sinusal" zone="CARDIO" onOpenTrends={onOpenTrends} />
        <Tile
          icon={Gauge}
          label="Presión arterial"
          value={`${Math.round(latest.systolic)}/${Math.round(latest.diastolic)}`}
          unit="mmHg"
          data={series.systolic}
          band={[100, thresholds.systolicWarning]}
          status={evaluation.bloodPressure}
          caption={`Umbral sistólico ${thresholds.systolicWarning}`}
          zone="CARDIO"
          onOpenTrends={onOpenTrends}
        />
        <Tile icon={Droplets} label="Saturación O₂" value={latest.spo2.toFixed(1)} unit="%" data={series.spo2} band={[95, 100]} status={evaluation.spo2} caption="SpO₂ periférica" zone="CARDIO" onOpenTrends={onOpenTrends} />
        <Tile icon={Activity} label="Gasto cardíaco" value={latest.cardiacOutput.toFixed(1)} unit="L/min" data={series.cardiacOutput} band={[4, 8]} status="NOMINAL" caption="Bioimpedancia torácica" zone="CARDIO" onOpenTrends={onOpenTrends} />
        <Tile
          icon={Brain}
          label="Presión intracraneal"
          value={latest.intracranialPressure.toFixed(1)}
          unit="mmHg"
          data={series.intracranialPressure}
          band={[5, thresholds.icpWarning]}
          status={evaluation.intracranialPressure}
          caption={`Estimada · umbral ${thresholds.icpWarning}`}
          zone="NEURO"
          onOpenTrends={onOpenTrends}
        />
        <Tile icon={Thermometer} label="Temperatura central" value={latest.coreTemperature.toFixed(2)} unit="°C" data={series.coreTemperature} band={[36.1, 37.5]} status={evaluation.temperature} caption="Sensor timpánico" zone="IMMUNE" onOpenTrends={onOpenTrends} />
      </div>
    </section>
  );
}
