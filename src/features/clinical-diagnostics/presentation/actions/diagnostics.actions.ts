"use server";

import { revalidatePath } from "next/cache";
import { createServerContainer } from "@/core/infrastructure/di/container";
import { runAction } from "@/core/utils/action-result";
import { AnalyzeClinicalFileSchema } from "../../application/dto/diagnostics.dto";

/** Runs the on-device model over an uploaded study's metadata and stores the finding. */
export async function analyzeClinicalFileAction(input: unknown) {
  return runAction(AnalyzeClinicalFileSchema, input, async (dto) => {
    const { clinicalDiagnostics } = await createServerContainer();
    const file = await clinicalDiagnostics.analyzeClinicalFile.execute(dto);
    revalidatePath("/", "layout");
    return file;
  });
}
