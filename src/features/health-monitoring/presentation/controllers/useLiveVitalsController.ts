"use client";

import * as React from "react";
import type { VitalSigns } from "../../domain/models/vital-signs.model";
import { getClientContainer } from "@/core/infrastructure/di/container.client";

const WINDOW = 40;
export type LiveVitalKey = Exclude<keyof VitalSigns, "recordedAt">;

/** Deterministic pseudo-noise so the server render and the first client render match. */
const noise = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

const SPREAD: Record<LiveVitalKey, number> = {
  heartRate: 2,
  systolic: 1.5,
  diastolic: 1,
  spo2: 0.25,
  respiratoryRate: 0.5,
  coreTemperature: 0.03,
  glucose: 1.2,
  cardiacOutput: 0.08,
  intracranialPressure: 0.15,
};
const KEYS = Object.keys(SPREAD) as LiveVitalKey[];

function seed(base: VitalSigns): Record<LiveVitalKey, number[]> {
  return Object.fromEntries(
    KEYS.map((k, ki) => [k, Array.from({ length: WINDOW }, (_, i) => Math.round((base[k] + noise(i, ki) * SPREAD[k] * 0.8) * 100) / 100)])
  ) as Record<LiveVitalKey, number[]>;
}

/**
 * Rolling window of live vital signs for one astronaut, fed by the VitalsStreamPort
 * (Supabase Realtime when configured, simulated otherwise).
 */
export function useLiveVitalsController(astronautId: string, baseline: VitalSigns) {
  const [series, setSeries] = React.useState(() => seed(baseline));
  const [latest, setLatest] = React.useState(baseline);
  const { vitalsStream, realtime } = getClientContainer();

  React.useEffect(() => {
    setSeries(seed(baseline));
    setLatest(baseline);
    return vitalsStream.subscribe(astronautId, baseline, (sample) => {
      setLatest(sample);
      setSeries((prev) => Object.fromEntries(KEYS.map((k) => [k, [...prev[k].slice(1 - WINDOW), sample[k]]])) as Record<LiveVitalKey, number[]>);
    });
    // Re-subscribe only when the astronaut changes, not on every server refresh of the baseline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astronautId, vitalsStream]);

  return { latest, series, source: realtime };
}
