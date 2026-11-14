"use client";

import * as React from "react";
import { Menu, Satellite, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useMission } from "@/components/providers/mission-provider";
import { ENVIRONMENTS, MISSION } from "@/lib/data/mock";
import type { EnvironmentId } from "@/lib/data/types";
import { SidebarContent } from "./sidebar";

function useClock() {
  const [now, setNow] = React.useState<string>(MISSION.utc);
  React.useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Topbar() {
  const { environment, setEnvironment, setCrisisOpen } = useMission();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const clock = useClock();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
          <Menu />
        </Button>

        <div className="flex min-w-0 items-center gap-3 text-[13px]">
          <span className="hidden font-medium sm:inline">{MISSION.name}</span>
          <Separator orientation="vertical" className="hidden !h-4 sm:block" />
          <span className="font-mono tabular text-muted-foreground">
            Sol <span className="text-foreground">{MISSION.sol}</span>
          </span>
          <span className="hidden font-mono tabular text-muted-foreground md:inline" suppressHydrationWarning>
            {clock} UTC
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Tabs value={environment.id} onValueChange={(v) => setEnvironment(v as EnvironmentId)} className="hidden xl:flex">
            <TabsList>
              {ENVIRONMENTS.map((e) => (
                <TabsTrigger key={e.id} value={e.id}>
                  {e.short}
                  <span className="font-mono text-[10.5px] text-muted-foreground">{e.gravity.toFixed(2)}g</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 md:flex" title={`Retardo de comunicación · ${environment.link}`}>
            <Satellite className="size-3.5 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">Retardo Tierra</span>
            <span className="font-mono text-[12.5px] tabular">{environment.earthDelay}</span>
          </div>

          <Button variant="outline" size="sm" className="border-critical/40 text-critical hover:bg-critical/10 hover:text-critical" onClick={() => setCrisisOpen(true)}>
            <Siren />
            <span className="hidden sm:inline">Modo crisis</span>
          </Button>

          <div className="flex items-center gap-2 pl-1">
            <div className="relative grid size-8 place-items-center rounded-full bg-secondary text-[12px] font-semibold">
              ER
              <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-caution" />
            </div>
            <div className="hidden leading-tight 2xl:block">
              <p className="text-[13px] font-medium">Cdr. Elena Rostova</p>
              <p className="text-[11.5px] text-muted-foreground">Oficial al mando</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="top-0 left-0 h-full max-h-none w-72 max-w-none translate-x-0 translate-y-0 rounded-none border-r p-0 data-[state=open]:slide-in-from-left">
          <DialogTitle className="sr-only">Navegación</DialogTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}
