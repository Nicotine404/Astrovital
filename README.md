# AstroVital

Herramienta visual para que un astronauta evalúe su propia salud durante una misión espacial y sepa qué hacer.

Propuesta para el reto *Create Health Monitoring Software for Astronauts on Space Missions* (NASA Space Apps Challenge 2026).

## Documentación

| Documento | Responde |
|---|---|
| [Visión y alcance](docs/01-vision-alcance.md) | Qué es, para quién, qué problema resuelve y qué recursos usa |
| [Casos de uso](docs/02-casos-de-uso.md) | Qué hace: CU-01 a CU-07 y funciones transversales, con criterios de aceptación |
| [Arquitectura](docs/03-arquitectura.md) | Cómo está construido: stack, capas, slices y carpetas |
| [Reglas clínicas](docs/04-reglas-clinicas.md) | De dónde salen los umbrales, las alertas y la misión del día |

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19** + TypeScript estricto
- **Tailwind CSS v4** + primitivas **shadcn/ui** (`src/core/presentation/ui`)
- **Zustand** (estado de UI) · `useOptimistic` / `useTransition` · **Zod** (DTOs)
- **Recharts** vía `ui/chart.tsx` · **sonner** (alertas y recordatorios)
- **three.js** + **@react-three/fiber** + **drei**: gemelo digital 3D
- **Supabase** (`@supabase/ssr`): PostgreSQL, RLS y Realtime. No hay backend propio: la lógica corre en Server Components y Server Actions (funciones serverless al desplegar)

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

### Conectar Supabase

1. Copia `.env.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. El esquema (tablas, RLS y publicación Realtime de `vital_signs`) vive en la instancia de Supabase del equipo.
3. Para cargar o reiniciar los datos de demostración: `npm run db:seed`.

Con las variables definidas, el contenedor de dependencias usa los adaptadores de Supabase y los signos vitales en vivo llegan por Realtime. Sin ellas, la app funciona con adaptadores en memoria y los mismos datos de demostración.

### Scripts

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` · `npm run lint` | Tipos y lint |
| `npm test` | Tests unitarios del dominio (`tests/`, patrón Arrange-Act-Assert, `node:test`) |
| `npm run db:seed` | Carga los datos de demostración en Supabase por la API |
| `npm run db:seed-sql` | Genera `supabase/seed.sql` con los mismos datos |
| `node scripts/build-anatomy.mjs <carpeta>` | Reconstruye el modelo 3D desde BodyParts3D (ver `public/models/README.md`) |

## Arquitectura

Clean Architecture + vertical slicing + DDD táctico. Detalle en [docs/03-arquitectura.md](docs/03-arquitectura.md).

```text
src/
  app/(dashboard)/            Rutas: / · /crew · /diagnostics · /medkit · /radiation · /environment · /wellbeing
  core/
    infrastructure/           supabase/ (SSR y navegador) · di/ (contenedores) · clock/
    presentation/             ui/ (shadcn) · layouts/ · shared/
    utils/                    cn.ts · action-result.ts
  features/
    health-monitoring/        Núcleo: CU-01 … CU-07
    clinical-diagnostics/     Diagnóstico asistido (simulado)
    mission-ops/              Botiquín y soporte vital (ECLSS)
tests/                        Tests unitarios
scripts/                      Seed de Supabase y build del modelo 3D
```

Reglas:

- El **dominio** no importa React, Next ni Supabase. Los umbrales clínicos viven en `ClinicalRulesService` y se recalculan según el lugar (nave, estación, base o rover en la Luna o Marte, Tierra).
- Los **componentes** son puros (props + callbacks). Datos y estado viven en los **controllers**.
- La conversión snake_case ↔ camelCase solo ocurre en los `*.mapper.ts`.
- Adaptadores y casos de uso se instancian únicamente en `core/infrastructure/di`.

## Paleta "Deep Field"

Neutros grafito fríos, un único acento azul acero (`--primary`) para interacción y una escala clínica reservada (`--nominal`, `--caution`, `--critical`) que siempre va acompañada de icono y etiqueta. Tokens en `src/app/globals.css`.

## Gemelo digital

Modelo anatómico real de **BodyParts3D** (CC BY-SA 2.1 JP): piel, 12 sistemas de órganos y 11 regiones del esqueleto. Todo es seleccionable con clic, en el visor o desde el inspector. Las zonas clínicas (cardiopulmonar, neurológica, inmune y metabólica, músculo-esquelética) aíslan sus estructuras y abren tendencias de 28 días.

- Controles: arrastrar para rotar, clic derecho para desplazar, rueda para acercar hacia el cursor, W/S para avanzar y retroceder, A/D para moverse a los lados, Q/E para subir y bajar, flechas para orbitar y Shift para ir más rápido. El botón «?» del visor muestra esta leyenda.
- Capas (piel, órganos, esqueleto, vasos) y vistas predefinidas.

## Licencia

Código bajo licencia MIT (ver `LICENSE`). El modelo anatómico `public/models/anatomy.bin` es un derivado de BodyParts3D y mantiene su licencia CC BY-SA 2.1 JP.
