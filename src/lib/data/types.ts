/**
 * Domain types. Each interface maps 1:1 to a planned Supabase table so the
 * mock layer in `mock.ts` can be swapped for real queries without touching UI.
 */

export type Status = "nominal" | "caution" | "critical";

export type OrganId =
  | "brain"
  | "inner-ear"
  | "thyroid"
  | "lungs"
  | "heart"
  | "liver"
  | "stomach"
  | "kidneys"
  | "intestine"
  | "wrist"
  | "femur"
  | "calcaneus";

export interface Metric {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}

/** table: organ_catalog */
export interface OrganInfo {
  id: OrganId;
  name: string;
  system: string;
  /** Position inside the 3D twin, metres, feet at y=0 */
  anchor: [number, number, number];
}

/** table: organ_assessments (crew_id, organ_id) */
export interface OrganAssessment {
  organId: OrganId;
  status: Status;
  title: string;
  summary: string;
  metrics: [Metric, Metric, Metric];
  action: string;
}

/** table: vitals_snapshots (latest row per crew member) */
export interface Vitals {
  heartRate: number;
  systolic: number;
  diastolic: number;
  spo2: number;
  cardiacOutput: number;
  boneDensityDelta: number;
  radiationMSv: number;
  icp: number;
  respRate: number;
  skinTemp: number;
}

/** table: crew_members */
export interface CrewMember {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  role: string;
  suitId: string;
  bloodType: string;
  status: Status;
  healthIndex: number;
  heightCm: number;
  vitals: Vitals;
  focusOrgan: OrganId;
  note: string;
  assessments: Partial<Record<OrganId, OrganAssessment>>;
}

export type EnvironmentId = "transit" | "orbital" | "rover" | "base";

/** table: mission_environments */
export interface MissionEnvironment {
  id: EnvironmentId;
  name: string;
  short: string;
  gravity: number;
  earthDelay: string;
  link: string;
}

export type ClinicalFileKind = "pdf" | "audio" | "video" | "dicom";

/** table: clinical_files (storage bucket: clinical-files) */
export interface ClinicalFile {
  id: string;
  name: string;
  kind: ClinicalFileKind;
  sizeMB: number;
  capturedAt: string;
  crewId: string;
  findings: string;
  confidence: number;
  model: string;
  latencyMs: number;
}

/** table: diagnoses */
export interface Diagnosis {
  id: string;
  crewId: string;
  title: string;
  status: Status;
  probability: number;
  summary: string;
  evidence: { label: string; value: string }[];
  recommendation: string;
  differentials: { label: string; probability: number }[];
}

/** table: medkit_items */
export interface MedkitItem {
  id: string;
  locker: string;
  name: string;
  category: string;
  stock: number;
  capacity: number;
  unit: string;
  expires: string;
  note: string;
}

/** table: radiation_readings */
export interface DosePoint {
  sol: number;
  cumulative: number;
  daily: number;
}

/** table: eclss_readings */
export interface EclssReading {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  nominalLow: number;
  nominalHigh: number;
  note: string;
  history: number[];
}
