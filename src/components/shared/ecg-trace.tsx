import { cn } from "@/lib/utils";

/** One PQRST complex over a 100-unit wide cell. */
function beat(x0: number) {
  const y = 20;
  const pts: [number, number][] = [
    [0, y], [14, y], [18, y - 2.5], [22, y], [30, y], [33, y + 2.5], [36, y - 15], [39.5, y + 6], [43, y],
    [56, y], [62, y - 4], [68, y], [100, y],
  ];
  return pts.map(([x, py]) => `${(x0 + x).toFixed(1)},${py}`).join(" L");
}

/** Scrolling ECG trace. Speed follows heart rate (one complex per beat). */
export function EcgTrace({ bpm, className, color = "var(--nominal)" }: { bpm: number; className?: string; color?: string }) {
  const beats = 6;
  const d = "M" + Array.from({ length: beats * 2 }, (_, i) => beat(i * 100)).join(" L");
  const duration = (beats * 60) / bpm;
  return (
    <div className={cn("relative h-10 overflow-hidden", className)} aria-hidden>
      <svg
        viewBox={`0 0 ${beats * 200} 40`}
        preserveAspectRatio="none"
        className="absolute inset-y-0 left-0 h-full w-[200%]"
        style={{ animation: `ecg-scroll ${duration}s linear infinite` }}
      >
        <path d={d} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
    </div>
  );
}
