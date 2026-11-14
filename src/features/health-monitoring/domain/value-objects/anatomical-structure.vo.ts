import type { BodyZone } from "./body-zone.vo";

/** Anatomical structures the system can assess individually. */
export const ANATOMICAL_STRUCTURES = [
  "brain",
  "eyes",
  "thyroid",
  "lungs",
  "heart",
  "vessels",
  "liver",
  "stomach",
  "spleen",
  "pancreas",
  "kidneys",
  "intestine",
  "skull",
  "spine",
  "ribcage",
  "shoulder",
  "humerus",
  "forearm",
  "hand",
  "pelvis",
  "femur",
  "tibia",
  "calcaneus",
  "wrist",
] as const;
export type AnatomicalStructureId = (typeof ANATOMICAL_STRUCTURES)[number];

export type StructureCategory = "organ" | "bone" | "device";

interface StructureDefinition {
  name: string;
  system: string;
  category: StructureCategory;
  zone: BodyZone;
}

export const STRUCTURES: Record<AnatomicalStructureId, StructureDefinition> = {
  brain: { name: "Cerebro", system: "Neurológico", category: "organ", zone: "NEURO" },
  eyes: { name: "Ojos y nervio óptico", system: "Neuro-oftálmico", category: "organ", zone: "NEURO" },
  thyroid: { name: "Laringe y región tiroidea", system: "Endocrino", category: "organ", zone: "IMMUNE" },
  lungs: { name: "Pulmones y bronquios", system: "Respiratorio", category: "organ", zone: "CARDIO" },
  heart: { name: "Corazón", system: "Cardiovascular", category: "organ", zone: "CARDIO" },
  vessels: { name: "Grandes vasos", system: "Vascular", category: "organ", zone: "CARDIO" },
  liver: { name: "Hígado y vesícula", system: "Hepatobiliar", category: "organ", zone: "IMMUNE" },
  stomach: { name: "Estómago y esófago", system: "Digestivo", category: "organ", zone: "IMMUNE" },
  spleen: { name: "Bazo", system: "Inmunológico", category: "organ", zone: "IMMUNE" },
  pancreas: { name: "Páncreas", system: "Endocrino", category: "organ", zone: "IMMUNE" },
  kidneys: { name: "Riñones y vía urinaria", system: "Renal", category: "organ", zone: "CARDIO" },
  intestine: { name: "Intestinos", system: "Gastrointestinal", category: "organ", zone: "IMMUNE" },
  skull: { name: "Cráneo", system: "Esqueleto axial", category: "bone", zone: "MUSCULOSKELETAL" },
  spine: { name: "Columna vertebral", system: "Esqueleto axial", category: "bone", zone: "MUSCULOSKELETAL" },
  ribcage: { name: "Caja torácica", system: "Esqueleto axial", category: "bone", zone: "MUSCULOSKELETAL" },
  shoulder: { name: "Cintura escapular", system: "Esqueleto apendicular", category: "bone", zone: "MUSCULOSKELETAL" },
  humerus: { name: "Húmero", system: "Esqueleto apendicular", category: "bone", zone: "MUSCULOSKELETAL" },
  forearm: { name: "Radio y cúbito", system: "Esqueleto apendicular", category: "bone", zone: "MUSCULOSKELETAL" },
  hand: { name: "Mano", system: "Esqueleto apendicular", category: "bone", zone: "MUSCULOSKELETAL" },
  pelvis: { name: "Pelvis", system: "Esqueleto axial", category: "bone", zone: "MUSCULOSKELETAL" },
  femur: { name: "Fémur", system: "Esqueleto apendicular", category: "bone", zone: "MUSCULOSKELETAL" },
  tibia: { name: "Tibia y peroné", system: "Esqueleto apendicular", category: "bone", zone: "MUSCULOSKELETAL" },
  calcaneus: { name: "Pie y calcáneo", system: "Esqueleto apendicular", category: "bone", zone: "MUSCULOSKELETAL" },
  wrist: { name: "Sensor de muñeca", system: "Telemetría SUIT", category: "device", zone: "CARDIO" },
};

export const isAnatomicalStructure = (value: string): value is AnatomicalStructureId =>
  (ANATOMICAL_STRUCTURES as readonly string[]).includes(value);

export const structuresInZone = (zone: BodyZone): AnatomicalStructureId[] =>
  ANATOMICAL_STRUCTURES.filter((id) => STRUCTURES[id].zone === zone);
