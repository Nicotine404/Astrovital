import seed from "./diagnostics.seed.json";
import type { ClinicalFileRow, DiagnosisRow } from "../mappers/diagnostics.mapper";

export interface DiagnosticsTables {
  diagnoses: DiagnosisRow[];
  clinical_files: ClinicalFileRow[];
}

/** Baseline studies cloned for the rest of the seeded crew (the commander has the full case file). */
const OTHER_CREW = ["thorne", "khan", "lee"];

export function buildDiagnosticsSeed(now: Date): DiagnosticsTables {
  const day = now.toISOString().slice(0, 10);
  const files: ClinicalFileRow[] = seed.clinical_files.map((f) => ({
    ...f,
    // Seed stores capture times as HH:MM; anchor them to the current mission day.
    captured_at: `${day}T${f.captured_at}:00.000Z`,
  }));
  const diagnoses = seed.diagnoses as DiagnosisRow[];
  const baseline = diagnoses.find((d) => d.id === "d2")!;
  return {
    diagnoses: [...diagnoses, ...OTHER_CREW.map((id) => ({ ...baseline, id: `d2-${id}`, astronaut_id: id }))],
    clinical_files: [
      ...files,
      ...OTHER_CREW.flatMap((id) =>
        files.slice(0, 2).map((f) => ({ ...f, id: `${f.id}-${id}`, astronaut_id: id, name: f.name.replace("Rostova", id[0].toUpperCase() + id.slice(1)) }))
      ),
    ],
  };
}
