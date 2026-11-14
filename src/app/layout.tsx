import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { TooltipProvider } from "@/core/presentation/ui/tooltip";
import { Toaster } from "@/core/presentation/ui/sonner";

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
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
