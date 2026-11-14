import { Activity, BrainCircuit, BriefcaseMedical, Radiation, Users, Wind, type LucideIcon } from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon; description: string }[] = [
  { href: "/", label: "Panel general", icon: Activity, description: "Gemelo digital y signos vitales" },
  { href: "/crew", label: "Tripulación", icon: Users, description: "Telemetría por tripulante" },
  { href: "/diagnostics", label: "Diagnóstico IA", icon: BrainCircuit, description: "Inferencia clínica local" },
  { href: "/medkit", label: "Botiquín", icon: BriefcaseMedical, description: "Inventario y dispensario" },
  { href: "/radiation", label: "Dosimetría", icon: Radiation, description: "Radiación GCR y SPE" },
  { href: "/environment", label: "Soporte vital", icon: Wind, description: "Atmósfera de cabina (ECLSS)" },
];
