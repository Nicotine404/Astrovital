import { createSupabaseBrowserClient } from "@/core/infrastructure/supabase/supabase.browser";
import type { VitalsStreamPort } from "@/features/health-monitoring/application/ports/out/vitals-stream.port";
import { SimulatedVitalsStream } from "@/features/health-monitoring/infrastructure/realtime/simulated-vitals.stream";
import { SupabaseVitalsStream } from "@/features/health-monitoring/infrastructure/realtime/supabase-vitals.stream";

/**
 * Composition root for the browser bundle. Only realtime adapters live here: everything
 * else goes through Server Actions and the server container (next/headers is server-only).
 */
let instance: { vitalsStream: VitalsStreamPort; realtime: "supabase" | "simulated" } | null = null;

export function getClientContainer() {
  if (instance) return instance;
  const db = createSupabaseBrowserClient();
  instance = db
    ? { vitalsStream: new SupabaseVitalsStream(db), realtime: "supabase" }
    : { vitalsStream: new SimulatedVitalsStream(), realtime: "simulated" };
  return instance;
}
