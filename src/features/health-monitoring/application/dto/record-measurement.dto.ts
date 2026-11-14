import { z } from "zod";
import { GRAVITY_ENVIRONMENT_IDS } from "../../domain/value-objects/gravity-environment.vo";
import { BODY_ZONES } from "../../domain/value-objects/body-zone.vo";

const astronautId = z.string().min(1).max(64);

export const ChangeGravitySchema = z.object({ environmentId: z.enum(GRAVITY_ENVIRONMENT_IDS) });
export type ChangeGravityDto = z.infer<typeof ChangeGravitySchema>;

export const RecordVitalSignsSchema = z.object({
  astronautId,
  heartRate: z.number().min(20).max(240),
  systolic: z.number().min(50).max(260),
  diastolic: z.number().min(20).max(160),
  spo2: z.number().min(50).max(100),
  respiratoryRate: z.number().min(4).max(60),
  coreTemperature: z.number().min(30).max(43),
  glucose: z.number().min(20).max(600),
  cardiacOutput: z.number().min(1).max(15),
  intracranialPressure: z.number().min(0).max(60),
});
export type RecordVitalSignsDto = z.infer<typeof RecordVitalSignsSchema>;

export const LogRadiationSchema = z.object({
  /** Omit to log the exposure for the whole crew (shared habitat). */
  astronautId: astronautId.optional(),
  source: z.enum(["GCR", "SPE"]),
  doseRateMsvDay: z.number().min(0).max(500),
  neutronFlux: z.number().min(0).max(100),
  durationHours: z.number().positive().max(72),
});
export type LogRadiationDto = z.infer<typeof LogRadiationSchema>;

export const MentalCheckinSchema = z.object({
  astronautId,
  sleepHours: z.number().min(0).max(14),
  stressLevel: z.number().int().min(1).max(10),
  mood: z.number().int().min(1).max(10),
  notes: z.string().trim().max(500).optional(),
});
export type MentalCheckinDto = z.infer<typeof MentalCheckinSchema>;

export const NutritionIntakeSchema = z
  .object({
    astronautId,
    caloriesKcal: z.number().min(0).max(5000).optional(),
    waterMl: z.number().min(0).max(5000).optional(),
    calciumMg: z.number().min(0).max(3000).optional(),
    vitaminDIu: z.number().min(0).max(10000).optional(),
  })
  .refine((v) => [v.caloriesKcal, v.waterMl, v.calciumMg, v.vitaminDIu].some((x) => x !== undefined && x > 0), {
    message: "Registra al menos un valor de ingesta",
  });
export type NutritionIntakeDto = z.infer<typeof NutritionIntakeSchema>;

export const RegisterAstronautSchema = z.object({
  name: z.string().trim().min(3).max(80),
  role: z.string().trim().min(2).max(80),
  suitId: z.string().trim().min(2).max(24),
  bloodType: z.enum(["O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−"]),
  heightCm: z.number().int().min(140).max(210),
});
export type RegisterAstronautDto = z.infer<typeof RegisterAstronautSchema>;

export const AstronautIdSchema = z.object({ astronautId });

export const VitalHistoryQuerySchema = z.object({ astronautId, zone: z.enum(BODY_ZONES), limit: z.number().int().min(5).max(120).default(28) });
export type VitalHistoryQueryDto = z.infer<typeof VitalHistoryQuerySchema>;
