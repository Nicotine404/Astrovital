import { z } from "zod";

/** Serialisable outcome of a Server Action, consumed by presentation controllers. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const isExpectedError = (e: unknown): e is Error & { code: string } => e instanceof Error && typeof (e as { code?: unknown }).code === "string";

/**
 * Validates `input` with Zod, runs `run`, and maps failures to messages fit for the UI.
 * Domain errors (any Error carrying a `code`) surface their message; anything else is logged
 * server-side and reported generically.
 */
export async function runAction<S extends z.ZodType, T>(schema: S, input: unknown, run: (data: z.infer<S>) => Promise<T>): Promise<ActionResult<T>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { ok: false, error: flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0] ?? "Datos no válidos", fieldErrors: flat.fieldErrors as Record<string, string[]> };
  }
  try {
    return { ok: true, data: await run(parsed.data) };
  } catch (e) {
    if (isExpectedError(e)) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Error interno del sistema. La operación no se ha registrado." };
  }
}
