import type * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Application shell. Feature contexts plug in through slots so core never imports a feature:
 * `topbarActions` (e.g. gravity selector, crisis button) and `overlays` (global dialogs).
 */
export function MissionDashboardLayout({
  children,
  topbarActions,
  overlays,
}: {
  children: React.ReactNode;
  topbarActions?: React.ReactNode;
  overlays?: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar actions={topbarActions} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
      {overlays}
    </>
  );
}
