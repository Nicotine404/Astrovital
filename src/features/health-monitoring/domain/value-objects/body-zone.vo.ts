/** Clinical body zones used for selection and trend analysis (RF-01). */
export const BODY_ZONES = ["CARDIO", "NEURO", "IMMUNE", "MUSCULOSKELETAL"] as const;
export type BodyZone = (typeof BODY_ZONES)[number];

export const BODY_ZONE_LABELS: Record<BodyZone, string> = {
  CARDIO: "Cardiopulmonar",
  NEURO: "Neurológico",
  IMMUNE: "Inmune y metabólico",
  MUSCULOSKELETAL: "Músculo-esquelético",
};

export const isBodyZone = (value: string): value is BodyZone => (BODY_ZONES as readonly string[]).includes(value);
