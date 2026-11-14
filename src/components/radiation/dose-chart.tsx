"use client";

import * as React from "react";
import type { DosePoint } from "@/lib/data/types";

/** Cumulative dose, single series, with crosshair tooltip and event annotation. */
export function DoseChart({ data, event }: { data: DosePoint[]; event?: { sol: number; label: string } }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<number | null>(null);

  const W = 800;
  const H = 260;
  const m = { t: 16, r: 16, b: 28, l: 44 };
  const maxSol = data[data.length - 1].sol;
  const maxY = Math.ceil(Math.max(...data.map((d) => d.cumulative)) / 25) * 25;
  const x = (sol: number) => m.l + (sol / maxSol) * (W - m.l - m.r);
  const y = (v: number) => H - m.b - (v / maxY) * (H - m.t - m.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(d.sol)},${y(d.cumulative)}`).join(" ");
  const yTicks = Array.from({ length: maxY / 25 + 1 }, (_, i) => i * 25).filter((v) => v % 50 === 0);
  const xTicks = data.filter((d) => d.sol % 50 === 0).map((d) => d.sol);

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const sol = ((px - m.l) / (W - m.l - m.r)) * maxSol;
    let best = 0;
    data.forEach((d, i) => {
      if (Math.abs(d.sol - sol) < Math.abs(data[best].sol - sol)) best = i;
    });
    setHover(best);
  };

  const h = hover != null ? data[hover] : null;

  return (
    <div ref={ref} className="relative touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Dosis acumulada por sol">
        <defs>
          <linearGradient id="doseFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="var(--grid)" />
            <text x={m.l - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fill="var(--muted-foreground)" fontSize="12.5" fontFamily="var(--font-mono)">
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((s) => (
          <text key={s} x={x(s)} y={H - 8} textAnchor="middle" fill="var(--muted-foreground)" fontSize="12.5" fontFamily="var(--font-mono)">
            {s}
          </text>
        ))}
        {event && (
          <g>
            <line x1={x(event.sol)} x2={x(event.sol)} y1={m.t} y2={H - m.b} stroke="var(--caution)" strokeDasharray="3 3" opacity="0.7" />
            <text x={x(event.sol) + 6} y={m.t + 10} fill="var(--muted-foreground)" fontSize="12.5">
              {event.label}
            </text>
          </g>
        )}
        <path d={`${line} L${x(maxSol)},${y(0)} L${x(0)},${y(0)} Z`} fill="url(#doseFill)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
        {h && (
          <g>
            <line x1={x(h.sol)} x2={x(h.sol)} y1={m.t} y2={H - m.b} stroke="var(--muted-foreground)" strokeDasharray="2 3" />
            <circle cx={x(h.sol)} cy={y(h.cumulative)} r="4.5" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-[12px] shadow-lg"
          style={{ left: `${Math.min(Math.max((x(h.sol) / W) * 100, 10), 90)}%` }}
        >
          <p className="font-medium">Sol {h.sol}</p>
          <p className="font-mono tabular text-muted-foreground">
            <span className="text-foreground">{h.cumulative}</span> mSv acumulados
          </p>
          <p className="font-mono tabular text-muted-foreground">
            <span className="text-foreground">{h.daily}</span> mSv/día
          </p>
        </div>
      )}
    </div>
  );
}
