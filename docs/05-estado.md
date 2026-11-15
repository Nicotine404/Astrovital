# Estado del proyecto

Fecha de corte: 2026-11-14 · rama `feature/cu-gaps`.

Leyenda: ✅ hecho · 🟡 parcial · ❌ pendiente · 🧪 simulado (funciona, pero los datos o el resultado no son reales).

## Casos de uso

| CU | Estado | Notas |
|---|---|---|
| CU-01 Estado anatómico y evolución | ✅ | Gemelo 3D (BodyParts3D), 4 zonas, inspector y tendencias de 28 días |
| CU-02 Signos vitales | ✅ 🧪 | Registro manual con guía de medición. El "en vivo" es un stream simulado salvo con Supabase Realtime |
| CU-03 Radiación CANS | ✅ 🧪 | Refugio y chequeo inmunológico. Las lecturas son sintéticas y el SPE se simula con un botón |
| CU-04 Entorno gravitacional | ✅ | Recalcula umbrales y rutina de ejercicio. La gravedad es global de la misión |
| CU-05 Musculoesquelético y fluidos | ✅ | Registro de ejercicio y reporte de visión/mareo. Densidad ósea y fluid shift son datos sembrados |
| CU-06 Salud mental y sueño | ✅ | Check-in diario y tendencia de 3 / 5 días |
| CU-07 Nutrición | 🟡 | Incluye proteínas; solo hay registro rápido con presets, no se pueden ingresar cantidades libres |

## Lo que pide el enunciado del desafío

| Punto del enunciado | Estado | Notas |
|---|---|---|
| Recoger indicadores (teclado, clics, imágenes) | ✅ | Formularios, botones y analizador de archivos clínicos (🧪) |
| Figura humana clicable con función y estado | ✅ | Gemelo digital 3D |
| Gráficas dinámicas de evolución | ✅ | Tendencias de 28 días y sparklines |
| Código de colores | ✅ | Semáforo NOMINAL / PRECAUCIÓN / CRÍTICO con icono y texto |
| Instrucciones simples de medición y riesgos | 🟡 | Guía en el registro de signos vitales y de síntomas; falta en el resto de indicadores |
| Cuándo pedir atención a la tripulación o a los médicos de vuelo | 🟡 | Las alertas lo dicen caso a caso; no hay un criterio de escalamiento explícito |
| Distintos entornos (nave, estación, rover, base) | 🟡 | Solo cambia la gravedad; no distingue nave, rover ni base |
| Recordatorios periódicos para medir o hacer rutinas | ❌ | |
| Gamificación | ❌ | |

## Extras

| Funcionalidad | Estado | Notas |
|---|---|---|
| Diagnóstico asistido por IA (`/diagnostics`) | 🧪 | `SimulatedClinicalAnalyzer` devuelve hallazgos de referencia. El modelo, la latencia y la confianza que muestra la UI **no son reales** |
| Botiquín (`/medkit`) y soporte vital ECLSS (`/environment`) | 🧪 | Datos de demostración, solo lectura |
| Vista de tripulación (`/crew`) | ✅ | Fuera del actor principal; ver [ADR-0004](adr/0004-actor-del-sistema.md) |

## Infraestructura

| Tema | Estado | Notas |
|---|---|---|
| Modo en memoria (sin variables de entorno) | ✅ | Seeds deterministas, mismo mapper que Supabase |
| Supabase | 🟡 | Migraciones `0001` y `0002` y `seed.sql` listos; falta aplicarlos en la instancia del equipo y definir el acceso (RLS solo permite `authenticated` y la app no tiene login) |
| Tests | ❌ | `ClinicalRulesService` es puro y es el primer candidato |
| CI | ❌ | |

## Deuda técnica conocida

- `exerciseMinutesToday` no vuelve a cero al cambiar de día.
- `npm run db:seed-sql` falla porque `tsx` no está en `devDependencies` (funciona con `npx tsx`).
- Los umbrales clínicos son aproximaciones para la demo; ver [reglas clínicas](04-reglas-clinicas.md).
