"use server";

import { revalidatePath } from "next/cache";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { runAction } from "@/core/utils/action-result";
import {
  AstronautIdSchema,
  ChangeGravitySchema,
  LogRadiationSchema,
  MentalCheckinSchema,
  RecordVitalSignsSchema,
  RegisterAstronautSchema,
  VitalHistoryQuerySchema,
} from "../../application/dto/record-measurement.dto";

/** Every mutation re-renders the dashboard layout so all pages see the recalibrated state. */
const refresh = () => revalidatePath("/", "layout");

/** RF-03: switch the operational gravity environment; all thresholds are recalculated server-side. */
export async function changeGravityEnvironmentAction(input: unknown) {
  return runAction(ChangeGravitySchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    const environment = await healthMonitoring.changeGravityEnvironment.execute(dto);
    refresh();
    return environment;
  });
}

export async function recordVitalSignsAction(input: unknown) {
  return runAction(RecordVitalSignsSchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    const evaluation = await healthMonitoring.recordVitalSigns.execute(dto);
    refresh();
    return evaluation;
  });
}

/** RF-02: register a radiation exposure (an SPE without astronautId hits the whole crew). */
export async function logRadiationExposureAction(input: unknown) {
  return runAction(LogRadiationSchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    const result = await healthMonitoring.logRadiationExposure.execute(dto);
    refresh();
    return result;
  });
}

/** RF-05 */
export async function logMentalCheckinAction(input: unknown) {
  return runAction(MentalCheckinSchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    const evaluation = await healthMonitoring.logMentalCheckin.execute(dto);
    refresh();
    return evaluation;
  });
}

export async function registerAstronautAction(input: unknown) {
  return runAction(RegisterAstronautSchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    const created = await healthMonitoring.registerAstronaut.execute(dto);
    refresh();
    return created;
  });
}

export async function unlinkAstronautAction(input: unknown) {
  return runAction(AstronautIdSchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    await healthMonitoring.unlinkAstronaut.execute(dto);
    refresh();
    return dto;
  });
}

/** RF-01 trends: read-only query used by the trends modal. */
export async function getVitalHistoryAction(input: unknown) {
  return runAction(VitalHistoryQuerySchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    return healthMonitoring.getVitalHistory.execute(dto);
  });
}
