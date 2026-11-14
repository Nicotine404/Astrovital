# AstroVital

Monitorización médica autónoma para tripulaciones en el espacio profundo.

## Stack

- **Next.js 15** (App Router) + **React 19.1** + TypeScript
- **Tailwind CSS v4** + componentes **shadcn/ui** (`src/components/ui`)
- **three.js** + **@react-three/fiber** + **@react-three/drei** — gemelo digital 3D
- **Supabase** (`@supabase/ssr`) — clientes listos en `src/lib/supabase`, backend en la siguiente fase

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin variables de entorno, la app funciona con datos simulados.

## Estructura

```
src/
  app/                      Rutas: / · /crew · /diagnostics · /medkit · /radiation · /environment
  components/
    ui/                     Primitivas shadcn/ui
    layout/                 Sidebar, barra superior, diálogo offline, protocolo de crisis
    twin/                   Gemelo digital 3D (body-scene.tsx) e inspector de órganos
    dashboard/              Signos vitales en vivo, análisis multimodal, resumen de tripulación
    shared/                 Sparkline, trazado ECG, badges de estado
    providers/              Estado de misión y notificaciones
  hooks/use-live-series.ts  Telemetría simulada (sustituir por Supabase Realtime)
  lib/data/types.ts         Tipos de dominio, 1:1 con las tablas previstas en Supabase
  lib/data/mock.ts          Datos simulados
  lib/supabase/             Clientes de navegador y servidor
```

## Paleta "Deep Field"

Neutros grafito fríos, un único acento azul acero (`--primary`) para interacción y una
escala clínica reservada (`--nominal`, `--caution`, `--critical`) que siempre va
acompañada de icono y etiqueta. Tokens en `src/app/globals.css`.

## Gemelo digital

La anatomía se genera proceduralmente (sin archivos externos), así que funciona
offline. Para usar un modelo propio, coloca un `.glb` en `public/models/` y cárgalo
con `useGLTF` de drei dentro de `Rig` en `src/components/twin/body-scene.tsx`.
Los puntos de anclaje de los órganos están en `ORGANS` (`src/lib/data/mock.ts`).
