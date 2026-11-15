"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Reminder } from "../../domain/services/daily-mission.domain-service";

const FIRST_DELAY_MS = 6_000;
const EVERY_MS = 90_000;

/**
 * Simulated periodic prompts: shows the pending reminders of the day as toasts, one at a time,
 * a few seconds after opening and then every 90 s. `showNext` lets the user ask for the next one.
 */
export function useRemindersController(astronautId: string, reminders: Reminder[]) {
  const index = React.useRef(0);
  const list = React.useRef(reminders);
  list.current = reminders;

  const showNext = React.useCallback(() => {
    const items = list.current;
    if (!items.length) {
      toast.success("Misión del día completa", { description: "No hay recordatorios pendientes." });
      return;
    }
    const r = items[index.current % items.length];
    index.current += 1;
    (r.urgency === "now" ? toast.warning : toast.info)("Recordatorio", { description: r.message, duration: 7000 });
  }, []);

  React.useEffect(() => {
    index.current = 0;
    const first = setTimeout(showNext, FIRST_DELAY_MS);
    const every = setInterval(showNext, EVERY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [astronautId, showNext]);

  return { showNext };
}
