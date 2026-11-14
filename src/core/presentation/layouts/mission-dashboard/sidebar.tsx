"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDriveDownload, Radio } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { NAV } from "./nav";
import { Logo } from "./logo";
import { OfflineDialog } from "./offline-dialog";
import { StatusDot } from "@/core/presentation/shared/StatusBadge";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Logo />
        <div className="leading-none">
          <p className="text-[15px] font-semibold tracking-tight">AstroVital</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Medicina autónoma</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3" aria-label="Principal">
        <p className="eyebrow px-2.5 pb-2">Operaciones</p>
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
              <Icon className={cn("size-4", active ? "text-primary" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        <OfflineDialog>
          <button
            type="button"
            className="group w-full rounded-lg border bg-card/60 p-3 text-left transition-colors hover:border-primary/40 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HardDriveDownload className="size-4 text-nominal" />
              <span className="text-[13px] font-medium">Modo autónomo</span>
              <StatusDot status="NOMINAL" />
            </div>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              100 % operativo sin enlace terrestre. 4 paquetes en cola.
            </p>
          </button>
        </OfflineDialog>
        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Radio className="size-3.5" /> Enlace EVA
          </span>
          <span className="font-mono text-foreground">SUIT-01 · UWB</span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block">
      <SidebarContent />
    </aside>
  );
}
