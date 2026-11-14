"use client";

import { Globe2, Loader2, Moon, Orbit, Satellite } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/core/presentation/ui/tooltip";
import { cn } from "@/core/utils/cn";
import type { GravityEnvironmentId } from "../../../domain/value-objects/gravity-environment.vo";
import type { GravityEnvironmentDto } from "../../../application/dto/dashboard-summary.dto";

const ICONS: Record<GravityEnvironmentId, React.ElementType> = { ZERO_G: Orbit, LUNAR: Moon, MARTIAN: Globe2, EARTH: Globe2 };

/** RF-03 selector. Pure: the current environment and the change handler come from useGravityController. */
export function GravityEnvironmentBar({
  environments,
  current,
  pending,
  onChange,
}: {
  environments: GravityEnvironmentDto[];
  current: GravityEnvironmentDto;
  pending: boolean;
  onChange: (id: GravityEnvironmentId) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div role="radiogroup" aria-label="Entorno gravitacional" className="hidden h-9 items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5 lg:flex">
        {environments.map((e) => {
          const Icon = ICONS[e.id];
          const active = e.id === current.id;
          return (
            <Tooltip key={e.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange(e.id)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] transition-colors outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
                    active ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-3.5", active && "text-primary")} />
                  <span className="hidden 2xl:inline">{e.location}</span>
                  <span className="font-mono text-[11px] tabular">{e.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {e.location} · {e.label} · retardo {e.commDelay}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* compact selector below lg */}
      <label className="relative lg:hidden">
        <span className="sr-only">Entorno gravitacional</span>
        <select
          value={current.id}
          onChange={(ev) => onChange(ev.target.value as GravityEnvironmentId)}
          className="h-8 appearance-none rounded-md border bg-muted/40 pr-2 pl-2.5 font-mono text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {environments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label} · {e.location}
            </option>
          ))}
        </select>
      </label>

      <div className="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 md:flex" title="Retardo de comunicación con control de misión">
        {pending ? <Loader2 className="size-3.5 animate-spin text-primary" /> : <Satellite className="size-3.5 text-muted-foreground" />}
        <span className="hidden text-[12px] text-muted-foreground xl:inline">Retardo Tierra</span>
        <span className="font-mono text-[12.5px] tabular">{current.commDelay}</span>
      </div>
    </div>
  );
}
