"use server";

import { revalidatePath } from "next/cache";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { runAction } from "@/core/utils/action-result";
import { NutritionIntakeSchema } from "../../application/dto/record-measurement.dto";

/** RF-06: add an intake to today's log and validate it against the daily targets. */
export async function logNutritionIntakeAction(input: unknown) {
  return runAction(NutritionIntakeSchema, input, async (dto) => {
    const { healthMonitoring } = await createServerContainer();
    const evaluation = await healthMonitoring.validateDailyNutrition.execute(dto);
    revalidatePath("/", "layout");
    return evaluation;
  });
}
