"use client";

/* shadcn/ui chart primitives (Recharts 2.x). */
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/core/utils/cn";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> });
};

type ChartContextProps = { config: ChartConfig };
const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[var(--grid)] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-layer]:outline-hidden [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color);
  if (!colorConfig.length) return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  className,
  hideLabel = false,
  label,
  labelFormatter,
  formatter,
  unit,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    unit?: string;
  }) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;
  return (
    <div className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-xl", className)}>
      {!hideLabel && <div className="font-medium">{labelFormatter ? labelFormatter(label, payload) : label}</div>}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${item.dataKey ?? item.name ?? "value"}`;
          const itemConfig = config[key];
          const color = item.color ?? `var(--color-${key})`;
          return (
            <div key={key} className="flex w-full items-center gap-2">
              <span className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />
              <span className="flex-1 text-muted-foreground">{itemConfig?.label ?? item.name}</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {formatter && item.value !== undefined && item.name ? formatter(item.value, item.name, item, index, item.payload) : item.value}
                {unit ? ` ${unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle };
