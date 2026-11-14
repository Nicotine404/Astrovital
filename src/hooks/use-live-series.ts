"use client";

import * as React from "react";

/**
 * Simulated live telemetry: a rolling window around a baseline with bounded
 * random walk. Replace with a Supabase Realtime subscription in the backend phase.
 */
/** Deterministic pseudo-random in [-1, 1] so server and client seeds match. */
function noise(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export function useLiveSeries(base: number, { jitter = 0.01, length = 40, interval = 1500, decimals = 1, monotonic = false } = {}) {
  const make = React.useCallback(
    (prev?: number) => {
      const p = prev ?? base;
      if (monotonic) return Number((p + Math.random() * base * jitter).toFixed(decimals));
      const drift = (base - p) * 0.25;
      const noise = (Math.random() - 0.5) * 2 * base * jitter;
      return Number((p + drift + noise).toFixed(decimals));
    },
    [base, jitter, decimals, monotonic]
  );

  const seed = React.useCallback(
    () =>
      Array.from({ length }, (_, i) =>
        Number(
          (monotonic
            ? base - (length - 1 - i) * base * jitter * 0.5
            : base + noise(i) * base * jitter * 0.8
          ).toFixed(decimals)
        )
      ),
    [base, jitter, length, decimals, monotonic]
  );
  // deterministic seed so SSR and first client render match
  const [series, setSeries] = React.useState<number[]>(seed);

  React.useEffect(() => {
    setSeries(seed());
    const id = setInterval(() => {
      setSeries((s) => [...s.slice(1), make(s[s.length - 1])]);
    }, interval);
    return () => clearInterval(id);
  }, [interval, make, seed]);

  return series;
}
