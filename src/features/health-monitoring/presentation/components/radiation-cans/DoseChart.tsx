"use client";

import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/core/presentation/ui/chart";
import type { DosePointDto } from "../../../application/dto/dashboard-summary.dto";

const config: ChartConfig = { cumulativeMsv: { label: "Dosis acumulada", color: "var(--primary)" } };
const day = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" });

/** Cumulative mission dose (single series). Solar particle events are annotated on the curve. */
export function DoseChart({ data }: { data: DosePointDto[] }) {
  const spe = data.filter((d) => d.source === "SPE");
  return (
    <div>
      <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
          <defs>
            <linearGradient id="doseFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-cumulativeMsv)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-cumulativeMsv)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis dataKey="recordedAt" tickFormatter={day} tickLine={false} axisLine={false} minTickGap={40} tickMargin={6} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={(v: number) => v.toFixed(0)} />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ChartTooltipContent
                unit="mSv"
                labelFormatter={(l, p) => {
                  const point = p?.[0]?.payload as DosePointDto | undefined;
                  return `${day(String(l))}${point ? ` · ${point.source} ${point.doseRateMsvDay} mSv/día` : ""}`;
                }}
              />
            }
          />
          <Area dataKey="cumulativeMsv" type="monotone" stroke="var(--color-cumulativeMsv)" strokeWidth={2} fill="url(#doseFill)" isAnimationActive={false} />
          {spe.map((p) => (
            <ReferenceDot key={p.recordedAt} x={p.recordedAt} y={p.cumulativeMsv} r={4} fill="var(--caution)" stroke="var(--card)" strokeWidth={2} />
          ))}
        </AreaChart>
      </ChartContainer>
      {spe.length > 0 && (
        <p className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
          <span className="size-2 rounded-full bg-caution" aria-hidden /> Evento de partículas solares (SPE) · {spe.length} en la ventana
        </p>
      )}
    </div>
  );
}
