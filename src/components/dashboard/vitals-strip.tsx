"use client";

import { Activity, Bone, Droplets, Gauge, HeartPulse, Radiation } from "lucide-react";
import { Sparkline } from "@/components/shared/sparkline";
import { useMission } from "@/components/providers/mission-provider";
import { useLiveSeries } from "@/hooks/use-live-series";
import { STATUS_META } from "@/lib/status";
import type { Status } from "@/lib/data/types";

function Tile({
  icon: Icon,
  label,
  base,
  unit,
  decimals = 0,
  jitter,
  band,
  status,
  caption,
  format,
  monotonic,
}: {
  icon: React.ElementType;
  label: string;
  base: number;
  unit: string;
  decimals?: number;
  jitter: number;
  band?: [number, number];
  status: Status;
  caption: string;
  format?: (v: number) => string;
  monotonic?: boolean;
}) {
  const series = useLiveSeries(base, { jitter, decimals, monotonic });
  const last = series[series.length - 1];
  const meta = STATUS_META[status];
  const SIcon = meta.icon;
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <SIcon className={`size-3.5 ${meta.text}`} aria-label={meta.label} />
      </div>
      <p className="font-mono text-[22px] leading-none font-medium tracking-tight tabular" suppressHydrationWarning>
        {format ? format(last) : last.toFixed(decimals)}
        <span className="ml-1 text-[12px] font-normal text-muted-foreground">{unit}</span>
      </p>
      <Sparkline data={series} band={band} unit={unit} />
      <p className="text-[11.5px] text-muted-foreground">{caption}</p>
    </div>
  );
}

export function VitalsStrip() {
  const { selectedCrew } = useMission();
  const v = selectedCrew.vitals;
  return (
    <section aria-label="Signos vitales" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" key={selectedCrew.id}>
      <Tile icon={HeartPulse} label="Frecuencia cardíaca" base={v.heartRate} unit="lpm" jitter={0.03} band={[50, 90]} status="nominal" caption="Ritmo sinusal" />
      <Tile
        icon={Gauge}
        label="Presión arterial"
        base={v.systolic}
        unit="mmHg"
        jitter={0.012}
        band={[100, 130]}
        status="nominal"
        caption="Sistólica · basal"
        format={(s) => `${s.toFixed(0)}/${v.diastolic}`}
      />
      <Tile icon={Droplets} label="Saturación O₂" base={v.spo2} unit="%" decimals={1} jitter={0.003} band={[95, 100]} status="nominal" caption="SpO₂ periférica" />
      <Tile icon={Activity} label="Gasto cardíaco" base={v.cardiacOutput} unit="L/min" decimals={1} jitter={0.02} band={[4, 8]} status="nominal" caption="Volumen sistólico OK" />
      <Tile
        icon={Bone}
        label="Densidad ósea"
        base={v.boneDensityDelta}
        unit="%"
        decimals={3}
        jitter={0.0015}
        monotonic
        format={(x) => x.toFixed(2)}
        status={v.boneDensityDelta < -1 ? "caution" : "nominal"}
        caption="Δ desde lanzamiento"
      />
      <Tile icon={Radiation} label="Dosis acumulada" base={v.radiationMSv} unit="mSv" decimals={2} jitter={0.0004} monotonic status="nominal" caption="Dosímetro del traje" />
    </section>
  );
}
