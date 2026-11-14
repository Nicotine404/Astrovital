# AstroVital

Monitorización médica autónoma para tripulaciones en el espacio profundo.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19.1** + TypeScript estricto
- **Tailwind CSS v4** + primitivas **shadcn/ui** (`src/core/presentation/ui`)
- **Zustand** (estado de sesión de UI) · `useOptimistic` / `useTransition` · **Zod** (DTOs)
- **Recharts** vía `ui/chart.tsx` · **sonner** (notificaciones)
- **three.js** + **@react-three/fiber** + **drei** — gemelo digital 3D
- **Supabase** (`@supabase/ssr`): cliente SSR en el servidor, cliente de navegador solo para Realtime

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin variables de entorno, la app usa adaptadores en memoria
sembrados con datos de demostración (mismo esquema y mismo mapper que con Supabase).

### Conectar Supabase

1. Copia `.env.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Aplica `supabase/migrations/0001_init.sql` (tablas, vista `latest_vital_signs`, RLS para
   `authenticated`, publicación Realtime de `vital_signs`).
3. Opcional: `npm run db:seed-sql` regenera `supabase/seed.sql` con los datos de demostración.

Con las variables definidas, el contenedor de dependencias enlaza automáticamente los
adaptadores de Supabase y la telemetría en vivo pasa a Supabase Realtime.

## Arquitectura

Clean Architecture + vertical slicing + DDD táctico.

```
src/
  app/(dashboard)/            Rutas: / · /crew · /diagnostics · /medkit · /radiation · /environment · /wellbeing
  core/
    infrastructure/
      supabase/               supabase.server.ts (SSR) · supabase.browser.ts (Realtime)
      di/                     container.ts (servidor) · container.client.ts (navegador)
    presentation/             ui/ (shadcn) · layouts/ · shared/
    utils/                    cn.ts · action-result.ts
  features/
    health-monitoring/        RF-01 … RF-06
      domain/                 models · value-objects · services (TypeScript puro)
      application/            ports/out · dto (Zod) · use-cases
      infrastructure/         persistence (adaptadores + mappers + seed) · realtime · anatomy
      presentation/           actions · controllers · components · views
    clinical-diagnostics/     Diagnóstico IA y análisis multimodal
    mission-ops/              Botiquín y soporte vital (ECLSS)
```

Reglas:

- El **dominio** no importa React, Next ni Supabase. Los umbrales clínicos viven en
  `ClinicalRulesService` y se recalculan según el entorno gravitacional (0 g, 0.16 g, 0.38 g, 1 g).
- Los **componentes** son puros (props + callbacks). Datos y estado viven en los **controllers**.
- La conversión snake_case ↔ camelCase solo ocurre en los `*.mapper.ts`.
- Adaptadores y casos de uso se instancian únicamente en `core/infrastructure/di`.

## Paleta "Deep Field"

Neutros grafito fríos, un único acento azul acero (`--primary`) para interacción y una
escala clínica reservada (`--nominal`, `--caution`, `--critical`) que siempre va
acompañada de icono y etiqueta. Tokens en `src/app/globals.css`.

## Gemelo digital

Modelo anatómico real de **BodyParts3D** (CC BY-SA 2.1 JP): piel, 12 sistemas de
órganos y 11 regiones del esqueleto. Todo es seleccionable con clic, en el visor o desde el
inspector. Las zonas clínicas (cardiopulmonar, neurológica, inmune, músculo-esquelética)
aíslan sus estructuras y abren tendencias de 28 días.

- Controles: arrastrar para rotar, botón derecho para desplazar, rueda para hacer
  zoom hacia el cursor, WASD/QE para moverse, flechas para orbitar, Shift acelera.
- Capas (piel, órganos, esqueleto, vasos) y vistas predefinidas.
- El modelo se regenera con `scripts/build-anatomy.mjs`; ver
  `public/models/README.md` para la fuente, la licencia y el formato.
