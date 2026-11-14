"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
  color?: string;
  /** Optional nominal band drawn behind the line */
  band?: [number, number];
  domain?: [number, number];
  unit?: string;
  area?: boolean;
  /** Time between samples and its unit, for the hover readout */
  xStep?: number;
  xUnit?: string;
}

/** Single-series line with a crosshair hover readout. 2px line, recessive band. */
export function Sparkline({ data, className, color = "var(--primary)", band, domain, unit, area = true, xStep = 1.5, xUnit = "s" }: SparklineProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const gid = React.useId().replace(/:/g, "");

  const lo = domain?.[0] ?? Math.min(...data);
  const hi = domain?.[1] ?? Math.max(...data);
  const pad = Math.max((hi - lo) * 0.35, Math.abs(hi) * 0.004, 0.01);
  const min = lo - pad;
  const max = hi + pad;
  const W = 100;
  const H = 32;
  const x = (i: number) => (i / Math.max(data.length - 1, 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const t = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    setHover(Math.round(t * (data.length - 1)));
  };

  const hv = hover != null ? data[hover] : null;

  return (
    <div
      ref={ref}
      className={cn("relative h-8 w-full touch-none", className)}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {band && (
          <rect
            x="0"
            width={W}
            y={Math.max(y(band[1]), 0)}
            height={Math.max(Math.min(y(band[0]), H) - Math.max(y(band[1]), 0), 0)}
            fill="var(--foreground)"
            opacity="0.035"
          />
        )}
        {area && <path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#g${gid})`} />}
        <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="var(--muted-foreground)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
        )}
      </svg>
      {hover != null && hv != null && (
        <>
          <span
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
            style={{ left: `${x(hover)}%`, top: `${(y(hv) / H) * 100}%`, background: color }}
          />
          <span
            className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 whitespace-nowrap rounded border bg-popover px-1.5 py-0.5 font-mono text-[10.5px] text-foreground shadow"
            style={{ left: `${Math.min(Math.max(x(hover), 12), 88)}%` }}
          >
            {hv}
            {unit ? ` ${unit}` : ""}
            <span className="ml-1.5 text-muted-foreground">
              {`−${+((data.length - 1 - hover) * xStep).toFixed(1)} ${xUnit}`}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
