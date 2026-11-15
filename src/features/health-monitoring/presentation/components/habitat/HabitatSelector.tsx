"use client";

import { Loader2, Satellite } from "lucide-react";
import type { HabitatId } from "../../../domain/value-objects/habitat.vo";
import type { HabitatDto } from "../../../application/dto/dashboard-summary.dto";

const GROUPS: { label: string; ids: HabitatId[] }[] = [
  { label: "Órbita y tránsito · 0 g", ids: ["SPACECRAFT", "ISS"] },
  { label: "Luna · 0.16 g", ids: ["LUNAR_BASE", "LUNAR_ROVER"] },
  { label: "Marte · 0.38 g", ids: ["MARS_BASE", "MARS_ROVER"] },
  { label: "Tierra · 1 g", ids: ["EARTH"] },
];

/** CU-04 place selector (vehicle or base). Pure: current place and change handler come from useHabitatController. */
export function HabitatSelector({
  habitats,
  current,
  pending,
  onChange,
}: {
  habitats: HabitatDto[];
  current: HabitatDto;
  pending: boolean;
  onChange: (id: HabitatId) => void;
}) {
  const byId = Object.fromEntries(habitats.map((h) => [h.id, h])) as Record<HabitatId, HabitatDto>;
  return (
    <div className="flex items-center gap-2">
      <label className="relative flex items-center">
        <span className="sr-only">Dónde estás</span>
        <select
          value={current.id}
          onChange={(ev) => onChange(ev.target.value as HabitatId)}
          className="h-8 max-w-[11rem] cursor-pointer appearance-none truncate rounded-md border bg-muted/40 pr-2 pl-2.5 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:max-w-none"
          title="Dónde está la tripulación: cambia la gravedad, el blindaje y la rutina"
        >
          {GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.ids.filter((id) => byId[id]).map((id) => (
                <option key={id} value={id}>
                  {byId[id].label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <span className="hidden font-mono text-[11.5px] tabular text-muted-foreground md:inline">{current.gravity.label}</span>
      <div className="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 md:flex" title="Retardo de comunicación con control de misión (solo ida)">
        {pending ? <Loader2 className="size-3.5 animate-spin text-primary" /> : <Satellite className="size-3.5 text-muted-foreground" />}
        <span className="hidden text-[12px] text-muted-foreground xl:inline">Retardo Tierra</span>
        <span className="font-mono text-[12.5px] tabular">{current.gravity.commDelay}</span>
      </div>
    </div>
  );
}
