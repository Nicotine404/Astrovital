import { AlertTriangle, CheckCircle2, OctagonAlert, type LucideIcon } from "lucide-react";

/**
 * Clinical traffic light as rendered by the UI. Structurally identical to the domain's
 * HealthStatus, declared here so core never depends on a feature module.
 */
export type ClinicalStatus = "NOMINAL" | "WARNING" | "CRITICAL";

/** CSS token names in globals.css (status colours are always paired with an icon and a label). */
export type StatusTone = "nominal" | "caution" | "critical";

export const STATUS_META: Record<ClinicalStatus, { label: string; icon: LucideIcon; tone: StatusTone; text: string; bg: string; cssVar: string; hex: string }> = {
  NOMINAL: { label: "Nominal", icon: CheckCircle2, tone: "nominal", text: "text-nominal", bg: "bg-nominal", cssVar: "var(--nominal)", hex: "#4fbf8b" },
  WARNING: { label: "Precaución", icon: AlertTriangle, tone: "caution", text: "text-caution", bg: "bg-caution", cssVar: "var(--caution)", hex: "#e8b04b" },
  CRITICAL: { label: "Crítico", icon: OctagonAlert, tone: "critical", text: "text-critical", bg: "bg-critical", cssVar: "var(--critical)", hex: "#f0616d" },
};
