"use client";

import * as React from "react";
import { loadAnatomyModel, type AnatomyModel } from "../../infrastructure/anatomy/anatomy-model.loader";
import ANATOMY from "../components/interactive-body/anatomy.generated.json";

const URL = `/models/anatomy.bin?v=${(ANATOMY as { version?: string }).version ?? "dev"}`;
let cache: Promise<AnatomyModel> | null = null;

/** Loads (once per page session) the anatomical model consumed by the pure BodyScene. */
export function useAnatomyModelController() {
  const [state, setState] = React.useState<{ model: AnatomyModel | null; error: string | null }>({ model: null, error: null });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    cache ??= loadAnatomyModel(URL);
    cache.then(
      (model) => alive && setState({ model, error: null }),
      (e: unknown) => {
        cache = null;
        if (alive) setState({ model: null, error: e instanceof Error ? e.message : "Error al cargar el modelo" });
      }
    );
    return () => {
      alive = false;
    };
  }, [attempt]);

  return {
    model: state.model,
    status: state.model ? ("ready" as const) : state.error ? ("error" as const) : ("loading" as const),
    error: state.error,
    retry: () => {
      setState({ model: null, error: null });
      setAttempt((n) => n + 1);
    },
  };
}
