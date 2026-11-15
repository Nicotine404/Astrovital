# ADR-0003 · Datos simulados y modo sin backend

- **Estado:** aceptada
- **Fecha:** 2026-11-14

## Contexto

No hay sensores reales ni historial clínico real de astronautas. El jurado y el equipo tienen que poder correr la app con `npm run dev`, sin configurar nada. Al mismo tiempo, la solución tiene que poder persistir de verdad.

## Decisión

- Cada puerto de repositorio tiene **dos adaptadores**: Supabase y en memoria. El contenedor DI elige Supabase si existen `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y memoria si no.
- El adaptador en memoria guarda **filas con la misma forma que PostgreSQL** (`snake_case`) y usa **el mismo mapper**, así los dos caminos ejercitan el mismo código.
- Los datos de demostración salen de **seeds deterministas** (ruido pseudoaleatorio con semilla fija). `supabase/seed.sql` se genera desde esos mismos seeds.
- Los signos vitales "en vivo" vienen de un `VitalsStreamPort`: simulador en el navegador, o Supabase Realtime si está configurado.
- Lo que es simulado se declara como tal:
  - Telemetría, dosimetría y check-ins sembrados.
  - Evento SPE disparado con un botón.
  - `SimulatedClinicalAnalyzer` del diagnóstico IA: devuelve hallazgos de referencia y una confianza y latencia derivadas del nombre del archivo.

## Consecuencias

- La demo funciona sin red ni base de datos.
- El estado en memoria dura lo que dura el proceso del servidor: se pierde al reiniciar.
- **Riesgo de credibilidad:** la pantalla de Diagnóstico IA muestra un nombre de modelo y una latencia que no son reales. Hay que marcarlo como simulación en la UI y en la presentación.
- Usar datos reales (por ejemplo de OSDR) implica solo un adaptador nuevo, no cambios en el dominio.
