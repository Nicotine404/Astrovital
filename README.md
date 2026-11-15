# PROJECT URL:
# https://astrovitae.santacruzweb.org/

# AstroVital

A visual tool designed to help astronauts assess their own health during space missions and determine the appropriate course of action.

Proposal for the **Create Health Monitoring Software for Astronauts on Space Missions** challenge at NASA Space Apps Challenge 2026.

## Documentation

| Document | Purpose |
|---|---|
| [Vision and Scope](docs/01-vision-alcance.md) | Defines what the system is, who it is designed for, the problem it addresses, and the resources it uses |
| [Use Cases](docs/02-casos-de-uso.md) | Describes system functionality: UC-01 through UC-07, cross-cutting features, and acceptance criteria |
| [Architecture](docs/03-arquitectura.md) | Explains the technical implementation, including the technology stack, architectural layers, vertical slices, and directory structure |
| [Clinical Rules](docs/04-reglas-clinicas.md) | Explains the sources of clinical thresholds, alerts, and daily mission recommendations |

## Technology Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19** + strict TypeScript
- **Tailwind CSS v4** + **shadcn/ui** primitives (`src/core/presentation/ui`)
- **Zustand** (UI state management) · `useOptimistic` / `useTransition` · **Zod** (DTO validation)
- **Recharts** via `ui/chart.tsx` · **sonner** (alerts and reminders)
- **three.js** + **@react-three/fiber** + **drei**: 3D digital twin
- **Supabase** (`@supabase/ssr`): PostgreSQL, Row-Level Security (RLS), and Realtime. No dedicated backend is required: application logic runs through Server Components and Server Actions (serverless functions when deployed).

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Connecting Supabase

1. Copy `.env.example` to `.env.local` and provide the values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. The database schema (tables, RLS policies, and Realtime publication for `vital_signs`) is hosted in the team's Supabase instance.
3. To load or reset the demonstration data, run: `npm run db:seed`.

When the environment variables are configured, the dependency container uses Supabase adapters, and real-time vital signs are delivered through Supabase Realtime.

Without these variables, the application runs using in-memory adapters and the same demonstration dataset.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Generates a production build |
| `npm run typecheck` · `npm run lint` | Runs type checking and linting |
| `npm test` | Runs domain unit tests (`tests/`), following the Arrange-Act-Assert pattern and using `node:test` |
| `npm run db:seed` | Loads demonstration data into Supabase through its API |
| `npm run db:seed-sql` | Generates `supabase/seed.sql` containing the same demonstration data |
| `node scripts/build-anatomy.mjs <folder>` | Rebuilds the 3D anatomical model from BodyParts3D (see `public/models/README.md`) |

## Architecture

Clean Architecture + Vertical Slicing + Tactical Domain-Driven Design (DDD).

See [docs/03-arquitectura.md](docs/03-arquitectura.md) for further details.

```text
src/
  app/(dashboard)/            Routes: / · /crew · /diagnostics · /medkit · /radiation · /environment · /wellbeing
  core/
    infrastructure/           supabase/ (SSR and browser) · di/ (dependency injection containers) · clock/
    presentation/             ui/ (shadcn) · layouts/ · shared/
    utils/                    cn.ts · action-result.ts
  features/
    health-monitoring/        Core functionality: UC-01 … UC-07
    clinical-diagnostics/     Assisted diagnostics (simulated)
    mission-ops/              Medical kit and Environmental Control and Life Support System (ECLSS)
tests/                        Unit tests
scripts/                      Supabase seeding and 3D model generation
```

**Architectural principles:**

- The **domain layer** does not depend on React, Next.js, or Supabase. Clinical thresholds are managed by `ClinicalRulesService` and recalculated according to the astronaut's location (spacecraft, space station, lunar or Martian base, rover, or Earth).
- **Components** are pure and receive data through props and callbacks. Data and application state are managed by **controllers**.
- Conversion between `snake_case` and `camelCase` occurs exclusively within `*.mapper.ts` files.
- Adapters and use cases are instantiated exclusively within `core/infrastructure/di`.

## "Deep Field" Color Palette

Cool graphite neutrals, a single steel-blue accent (`--primary`) for interactive elements, and a dedicated clinical status scale (`--nominal`, `--caution`, `--critical`).

Each clinical status is always accompanied by an icon and a descriptive label to ensure clear and accessible communication.

Design tokens are defined in `src/app/globals.css`.

## Digital Twin

A realistic anatomical model based on **BodyParts3D** (CC BY-SA 2.1 JP), featuring:

- Skin
- 12 organ systems
- 11 skeletal regions

All anatomical structures are selectable, either directly within the 3D viewer or through the inspector panel.

Clinical zones (cardiopulmonary, neurological, immune and metabolic, and musculoskeletal) isolate their corresponding anatomical structures and provide access to 28-day health trends.

**Navigation controls:**

- Drag to rotate the model.
- Right-click and drag to pan.
- Scroll to zoom toward the cursor.
- `W` / `S` to move forward and backward.
- `A` / `D` to move sideways.
- `Q` / `E` to move up and down.
- Arrow keys to orbit the model.
- `Shift` to increase movement speed.

The viewer's **"?"** button displays the complete navigation guide.
- Layers (skin, organs, skeleton, and blood vessels) and predefined views.

## License

The source code is licensed under the MIT License (see `LICENSE`). The anatomical model `public/models/anatomy.bin` is a derivative of BodyParts3D and retains its original **CC BY-SA 2.1 JP** license.
