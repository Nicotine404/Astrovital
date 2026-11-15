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
        <footer className="mx-auto w-full max-w-[1600px] border-t px-4 py-4 text-[11.5px] leading-relaxed text-muted-foreground sm:px-6">
          <p>
            <strong className="font-medium text-foreground">Prototipo de demostración, no es un dispositivo médico.</strong> Los umbrales clínicos son
            aproximaciones sin validación clínica y los datos de telemetría son simulados.
          </p>
          <p>
            Modelo anatómico:{" "}
            <a className="underline underline-offset-2 hover:text-foreground" href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">
              BodyParts3D
            </a>{" "}
            © The Database Center for Life Science, licencia CC BY-SA 2.1 JP. Proyecto para NASA Space Apps Challenge 2026.
          </p>
        </footer>
      </div>
      {overlays}
    </>
  );
}
