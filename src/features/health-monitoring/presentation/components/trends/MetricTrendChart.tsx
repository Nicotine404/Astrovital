"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/core/presentation/ui/chart";
import type { TrendSeriesDto } from "../../../application/dto/vital-history.dto";

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" });

/**
 * One measure per chart (never two y-scales). Thresholds are drawn as labelled reference
 * lines in the reserved status colours; the series itself uses the interaction accent.
 */
export function MetricTrendChart({ series }: { series: TrendSeriesDto }) {
  const config: ChartConfig = { value: { label: series.label, color: "var(--primary)" } };
  const data = series.points.map((p) => ({ t: p.t, value: p.value }));
  const values = data.map((d) => d.value);
  const refs = [series.warning, series.critical].filter((v): v is number => v !== undefined);
  const lo = Math.min(...values, ...refs);
  const hi = Math.max(...values, ...refs);
  const pad = Math.max((hi - lo) * 0.12, Math.abs(hi) * 0.01, 0.1);
  const last = values.at(-1);

  return (
    <figure className="rounded-lg border bg-card p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium">{series.label}</span>
        <span className="font-mono text-[15px] tabular">
          {last?.toFixed(Math.abs(last) < 10 ? 2 : 1)}
          <span className="ml-1 text-[11px] text-muted-foreground">{series.unit}</span>
        </span>
      </figcaption>
      <ChartContainer config={config} className="aspect-auto h-[170px] w-full">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="0" stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis dataKey="t" tickFormatter={dayLabel} tickLine={false} axisLine={false} minTickGap={36} tickMargin={6} fontSize={11} />
          <YAxis domain={[lo - pad, hi + pad]} tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={(v: number) => (Math.abs(v) < 10 ? v.toFixed(1) : v.toFixed(0))} />
          {series.warning !== undefined && (
            <ReferenceLine y={series.warning} stroke="var(--caution)" strokeDasharray="4 3" strokeOpacity={0.8} label={{ value: `Precaución ${series.warning}`, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 10 }} />
          )}
          {series.critical !== undefined && (
            <ReferenceLine y={series.critical} stroke="var(--critical)" strokeDasharray="4 3" strokeOpacity={0.8} label={{ value: `Crítico ${series.critical}`, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 10 }} />
          )}
          <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent unit={series.unit} labelFormatter={(l) => dayLabel(String(l))} />} />
          <Line dataKey="value" type="linear" stroke="var(--color-value)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </figure>
  );
}
