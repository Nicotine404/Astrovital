import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { MissionProvider } from "@/components/providers/mission-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CrisisDialog } from "@/components/layout/crisis-dialog";

export const metadata: Metadata = {
  title: { default: "AstroVital", template: "%s · AstroVital" },
  description: "Monitorización médica autónoma para tripulaciones en el espacio profundo.",
  applicationName: "AstroVital",
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh font-sans">
        <MissionProvider>
          <TooltipProvider>
            <ToastProvider>
            <Sidebar />
            <div className="lg:pl-60">
              <Topbar />
              <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
            </div>
            <CrisisDialog />
            </ToastProvider>
          </TooltipProvider>
        </MissionProvider>
      </body>
    </html>
  );
}
