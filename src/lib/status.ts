import { AlertTriangle, CheckCircle2, OctagonAlert, type LucideIcon } from "lucide-react";
import type { Status } from "@/lib/data/types";

export const STATUS_META: Record<Status, { label: string; icon: LucideIcon; text: string; bg: string; hex: string }> = {
  nominal: { label: "Nominal", icon: CheckCircle2, text: "text-nominal", bg: "bg-nominal", hex: "#4fbf8b" },
  caution: { label: "Precaución", icon: AlertTriangle, text: "text-caution", bg: "bg-caution", hex: "#e8b04b" },
  critical: { label: "Crítico", icon: OctagonAlert, text: "text-critical", bg: "bg-critical", hex: "#f0616d" },
};
