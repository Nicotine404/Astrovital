import { Sparkline } from "@/core/presentation/shared/Sparkline";
import { StatusBadge } from "@/core/presentation/shared/StatusBadge";
import type { EclssReadingDto } from "../../application/dto/mission-ops.dto";

function RangeGauge({ r }: { r: EclssReadingDto }) {
  const pct = (v: number) => ((v - r.min) / (r.max - r.min)) * 100;
  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 rounded-full bg-nominal/25"
          style={{ left: `${pct(r.nominalLow)}%`, width: `${pct(r.nominalHigh) - pct(r.nominalLow)}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
          style={{ left: `${pct(r.value)}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10.5px] text-muted-foreground tabular">
        <span>{r.min}</span>
        <span>
          nominal {r.nominalLow}–{r.nominalHigh}
        </span>
        <span>{r.max}</span>
      </div>
    </div>
  );
}

/** One ECLSS channel: value, nominal band and the last 12 h. Pure, server-renderable. */
export function EclssReadingCard({ r }: { r: EclssReadingDto }) {
  return (
  <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[13px] text-muted-foreground">{r.label}</p>
        <p className="mt-1.5 font-mono text-[28px] leading-none font-medium tracking-tight tabular">
          {r.value}
          <span className="ml-1 text-[13px] font-normal text-muted-foreground">{r.unit}</span>
        </p>
      </div>
      <StatusBadge status={r.status} />
    </div>
    <RangeGauge r={r} />
    <div>
      <p className="mb-1 text-[11.5px] text-muted-foreground">Últimas 12 h</p>
      <Sparkline data={[...r.history]} unit={r.unit} xStep={1} xUnit="h" />
    </div>
    <p className="border-t pt-3 text-[12.5px] text-muted-foreground">{r.note}</p>
  </div>
  );
}
