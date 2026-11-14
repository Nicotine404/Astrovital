"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/core/presentation/ui/button";
import { Separator } from "@/core/presentation/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/core/presentation/ui/dialog";
import { SidebarContent } from "./sidebar";
import { MISSION, missionDay } from "./mission";

function useUtcClock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Generic shell header: mission identity and clock on the left, feature-provided controls on the right. */
export function Topbar({ actions }: { actions?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const now = useUtcClock();

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
            Día <span className="text-foreground">{now ? missionDay(now) : "—"}</span>
          </span>
          <span className="hidden font-mono tabular text-muted-foreground md:inline">
            {now ? now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" }) : "--:--:--"} UTC
          </span>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">{actions}</div>
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
