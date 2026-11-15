# Arquitectura

AstroVital combina **Clean Architecture**, **vertical slicing por feature** y **DDD táctico** sobre **Next.js 15 (App Router)** y **TypeScript estricto**. El dominio clínico es TypeScript puro: no conoce React, Next ni Supabase. No hay un backend propio: Supabase es la base de datos y Next.js pone la lógica en Server Components y Server Actions, que al desplegar corren como funciones serverless.

## Stack

| Categoría | Tecnología | Rol |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript estricto | Server Components, Server Actions |
| UI | shadcn/ui (Radix + Tailwind CSS v4) en `core/presentation/ui` | Primitivas accesibles |
| 3D | three.js + @react-three/fiber + drei | Gemelo digital (modelo BodyParts3D) |
| Gráficas | Recharts vía `ui/chart.tsx` | Tendencias |
| Estado cliente | Zustand (solo estado de UI) + `useOptimistic` / `useTransition` | Controllers |
| Validación | Zod | DTOs e inputs de Server Actions |
| Persistencia | Supabase (`@supabase/ssr`): PostgreSQL, RLS, Realtime | Datos de la app y signos vitales en vivo. Sin variables de entorno, la app usa adaptadores en memoria |
| Notificaciones | sonner | Alertas y recordatorios |
| Tests | `node:test` + tsx | Tests unitarios del dominio en `tests/` |

## Bounded contexts

| Slice | Responsabilidad | Casos de uso |
|---|---|---|
| `health-monitoring` | **Núcleo.** Telemetría biomédica, reglas clínicas, hábitat y gravedad, radiación, musculoesquelético, mente, nutrición y misión del día | CU-01 a CU-07 |
| `clinical-diagnostics` | Diagnósticos e hipótesis a partir de archivos clínicos (imagen, audio, PDF, DICOM). **Analizador simulado** | Extra |
| `mission-ops` | Botiquín y lecturas de soporte vital de cabina (ECLSS) | Extra |

## Estructura de directorios

```text
src/
├── app/(dashboard)/                 Rutas: / · /crew · /diagnostics · /medkit · /radiation · /wellbeing · /environment
│   ├── layout.tsx                   Carga el resumen (SSR) y monta MissionDashboardLayout
│   └── */page.tsx                   Server Components: piden datos al contenedor DI
├── core/
│   ├── infrastructure/
│   │   ├── di/container.ts          Composition root del servidor (único lugar con `new`)
│   │   ├── di/container.client.ts   Composition root del navegador (solo Realtime)
│   │   ├── supabase/                Cliente SSR (cookies) y cliente de navegador
│   │   └── clock/                   Reloj del sistema (ClockPort)
│   ├── presentation/
│   │   ├── ui/                      Primitivas shadcn/ui
│   │   ├── layouts/mission-dashboard/
│   │   └── shared/                  StatusBadge, Sparkline, PageHeader, EcgTrace…
│   └── utils/                       cn.ts, action-result.ts (runAction: Zod + mapeo de errores)
└── features/
    ├── health-monitoring/
    │   ├── domain/                  models · value-objects (gravedad, hábitat…) · services (reglas clínicas, misión del día)
    │   ├── application/             ports/out · dto (Zod) · use-cases
    │   ├── infrastructure/          persistence (adaptadores, mapper, seeds) · realtime · anatomy
    │   └── presentation/            actions · controllers · components · views · content (guías «?»)
    ├── clinical-diagnostics/        Misma estructura de 4 capas
    └── mission-ops/                 Misma estructura de 4 capas
tests/
├── support/builders.ts              Datos de prueba
└── unit/…                           Replica la estructura de src/ · patrón Arrange-Act-Assert
scripts/
├── seed-supabase.ts                 npm run db:seed · carga los datos de demo por la API
├── generate-supabase-seed.ts        npm run db:seed-sql · genera supabase/seed.sql
└── build-anatomy.mjs                Reconstruye el modelo 3D desde BodyParts3D
supabase/
└── seed.sql                         Datos de demostración en SQL (necesita el esquema ya creado)
```
