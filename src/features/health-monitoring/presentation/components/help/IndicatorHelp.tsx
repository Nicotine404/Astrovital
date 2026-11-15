"use client";

import { AlertTriangle, Info, Orbit, Ruler } from "lucide-react";
import { HelpDialog, HelpSection } from "@/core/presentation/shared/HelpDialog";
import { INDICATOR_GUIDES, type GuideId } from "../../content/indicator-guides";

/** "?" button with the plain-language guide for one indicator. */
export function IndicatorHelp({ id, className }: { id: GuideId; className?: string }) {
  const g = INDICATOR_GUIDES[id];
  return (
    <HelpDialog title={g.title} description="Guía rápida para medir e interpretar este indicador." className={className}>
      <HelpSection icon={Info} heading="Qué es">
        {g.what}
      </HelpSection>
      <HelpSection icon={Ruler} heading="Cómo se mide a bordo">
        {g.howTo}
      </HelpSection>
      <HelpSection icon={Orbit} heading="Por qué importa en el espacio">
        {g.whySpace}
      </HelpSection>
      <HelpSection icon={AlertTriangle} heading="Qué hacer si sale mal">
        {g.actIf}
      </HelpSection>
    </HelpDialog>
  );
}
