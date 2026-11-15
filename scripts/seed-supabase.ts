/**
 * Loads the demo data into Supabase through its REST API (same seed builders as the
 * in-memory adapters). Needs the schema (supabase/migrations) applied and write access
 * for the key in .env.local (migration 0003 grants it to anon for the demo).
 *   npx tsx scripts/seed-supabase.ts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { buildSeedTables } from "../src/features/health-monitoring/infrastructure/persistence/seed/telemetry.seed";
import { buildDiagnosticsSeed } from "../src/features/clinical-diagnostics/infrastructure/persistence/seed/diagnostics.seed";
import missionOps from "../src/features/mission-ops/infrastructure/persistence/seed/mission-ops.seed.json";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");

const db = createClient(url, key, { auth: { persistSession: false } });
const now = new Date();
const t = buildSeedTables(now);
const d = buildDiagnosticsSeed(now);

type Rows = Record<string, unknown>[];
// Insertion order respects foreign keys. [table, rows, onConflict]
const tables: [string, Rows, string][] = [
  ["mission_state", t.mission_state as unknown as Rows, "id"],
  ["astronauts", t.astronauts.map((r, i) => ({ ...r, created_at: new Date(now.getTime() + i * 1000).toISOString() })), "id"],
  ["vital_signs", t.vital_signs as unknown as Rows, "astronaut_id,recorded_at"],
  ["organ_assessments", t.organ_assessments as unknown as Rows, "astronaut_id,structure_id"],
  ["radiation_dosimetry", t.radiation_dosimetry as unknown as Rows, "astronaut_id"],
  ["radiation_readings", t.radiation_readings as unknown as Rows, "astronaut_id,recorded_at"],
  ["musculoskeletal_status", t.musculoskeletal_status as unknown as Rows, "astronaut_id"],
  ["musculoskeletal_history", t.musculoskeletal_history as unknown as Rows, "astronaut_id,recorded_at"],
  ["mental_checkins", t.mental_checkins as unknown as Rows, "astronaut_id,recorded_at"],
  ["nutrition_logs", t.nutrition_logs as unknown as Rows, "astronaut_id,log_date"],
  ["diagnoses", d.diagnoses as unknown as Rows, "id"],
  ["clinical_files", d.clinical_files as unknown as Rows, "id"],
  ["medkit_items", missionOps.medkit_items as unknown as Rows, "id"],
  ["eclss_readings", missionOps.eclss_readings.map((r, i) => ({ ...r, sort_order: i })), "id"],
];

async function main() {
  for (const [table, rows, onConflict] of tables) {
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db.from(table).upsert(rows.slice(i, i + 200), { onConflict });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    console.log(`${table}: ${rows.length} filas`);
  }
  console.log("Datos de demostración cargados.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
