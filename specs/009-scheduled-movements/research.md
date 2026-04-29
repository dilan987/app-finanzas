# Phase 0 — Research: Movimientos programados y proyección quincenal

## R1 · Iteración de ocurrencias dentro del mes

**Decisión**: para cada movimiento activo del usuario, en `getProjection(month, year)`:
- Comenzar desde `nextExecutionDate`.
- Si la fecha cae dentro del mes solicitado, agregar la ocurrencia al output.
- Si la frecuencia es repetitiva, avanzar con `calculateNextExecutionDate` (función existente en `recurring.service.ts:21`) y repetir hasta que la fecha salga del mes.
- Si la frecuencia es `ONCE`, solo se considera la fecha exacta de `nextExecutionDate`.
- Si la `nextExecutionDate` cae después del último día del mes solicitado, el movimiento no aporta ocurrencias para ese mes.
- Si la `nextExecutionDate` cae antes del primer día del mes (movimiento "atrasado"), se considera una sola ocurrencia con la fecha real para no inflar la proyección con ocurrencias retroactivas; las repetitivas atrasadas avanzan con `calculateNextExecutionDate` hasta entrar en el mes.

**Rationale**: reutiliza la función existente sin duplicar lógica de cálculo de fechas. Maneja tanto repetitivos como puntuales. Es predecible y testeable.

**Alternativas consideradas**:
- Pre-calcular y persistir todas las ocurrencias futuras: rechazado por sobrecosto de almacenamiento y por desincronización si cambia la fecha de un recurrente.
- Usar una librería de cron expressions: rechazado por dependencia adicional (constitución V) sin valor agregado.

## R2 · Reglas de quincena

**Decisión**:
- Primera quincena = días 1 a 15 (inclusive).
- Segunda quincena = día 16 al último día calendario del mes (28, 29, 30 o 31 según corresponda).
- La asignación de un movimiento se basa en `getDate()` de su `nextExecutionDate` (día calendario, sin considerar zona horaria del usuario más allá de la fecha que se almacena).

**Rationale**: convención simple, intuitiva en el contexto colombiano (donde "quincena" tiene este uso explícito), y testeable con casos de borde (febrero, día 15 vs 16).

**Alternativas consideradas**:
- Quincena del 15 al 30 (corrida): rechazado, no es la convención esperada.
- Permitir al usuario configurar el corte: rechazado por scope; si surge demanda se hace en una iteración posterior.

## R3 · Movimientos `ONCE` ya ejecutados

**Decisión**: tras ejecutarse un movimiento `ONCE`, queda con `isActive=false`. La proyección solo considera movimientos activos, por lo tanto:
- No aparece en proyección de meses futuros.
- Para el mes en que se ejecutó, ya no aporta a la proyección porque su transacción real ya existe (y ese mes pasa a verse en la sección "transacciones reales" del resumen mensual).
- En la sección "Movimientos programados" se muestra con badge "Ejecutado" para contexto histórico; el filtro "Puntuales" lo incluye por defecto pero permite ocultar inactivos.

**Rationale**: respeta el invariante "active → cuenta en proyección"; evita duplicación con la transacción real generada.

**Alternativas consideradas**:
- Eliminar el movimiento `ONCE` tras ejecutar: rechazado por perder trazabilidad.
- Mantener `isActive=true` y depender de un flag `executed`: rechazado por añadir un campo redundante.

## R4 · UX del filtro y del form

**Decisión**:
- En `RecurringPage` se añade un set de tabs/chips: `Todos | Repetitivos | Puntuales`. Por defecto "Todos".
- El form actual ya tiene un selector de frecuencia y un campo de fecha. Solo añadimos `ONCE` como opción al selector. No se necesita cambiar el `DatePicker` (que es lo que ya soporta fechas absolutas).
- Cuando frecuencia es `ONCE`, mostramos un hint "Se ejecutará una sola vez en esta fecha" debajo del selector, para reforzar el comportamiento al usuario.
- Validación opcional: si la fecha es pasada y frecuencia es `ONCE`, mostrar advertencia visual (no bloqueante).

**Rationale**: cambios mínimos en UI, reusan componentes existentes, sin nuevas dependencias.

## R5 · Ubicación de la lógica de proyección

**Decisión**: nuevo archivo `backend/src/modules/recurring/projection.service.ts` que contiene `getProjection(userId, month, year)`. El controller del módulo expone `GET /api/recurring/projection`. La sección Budgets en el frontend la consume.

**Rationale**: cohesión por dominio; el cálculo depende íntimamente de `calculateNextExecutionDate` y del esquema de `RecurringTransaction`. Mantenerlo dentro del módulo evita acoplamiento cruzado con `budgets/`.

**Alternativas consideradas**:
- Endpoint en `budgets/summary`: rechazado por acoplamiento.
- Endpoint en `analytics/`: rechazado, analytics se ocupa de datos reales no proyectados.

## R6 · Compatibilidad con tests existentes

**Decisión**: ejecutar el test suite existente del módulo `recurring/` después del cambio para garantizar no-regresión. Añadir tests específicos para:
- Crear con frecuencia `ONCE` válido.
- Ejecución de un `ONCE`: verifica que tras `processRecurring` queda `isActive=false` y no se actualiza `nextExecutionDate`.
- Ejecución de uno `MONTHLY`: comportamiento intacto.
- Endpoint `/projection`: asignación correcta a quincena con casos de borde (día 15, día 16, último día de febrero, repetitivo que dispara dos veces en un mes).

## R7 · Versionado y telemetría futura

**Decisión**: el endpoint de proyección devuelve un objeto con shape estable y descriptivo (ver contracts) que un agente IA futuro puede consultar sin transformación. Si en el futuro se introducen cambios incompatibles, se versiona vía path (`/api/v2/...`) según convención del proyecto.

## Resumen

| ID | Decisión |
|----|----------|
| R1 | Iterar `calculateNextExecutionDate` por movimiento dentro del mes |
| R2 | Quincena 1: días 1–15; Quincena 2: día 16 al último día |
| R3 | `ONCE` ejecutado pasa a `isActive=false`; no aparece en proyección futura |
| R4 | Tabs en RecurringPage; añadir `ONCE` al selector con hint |
| R5 | Lógica en `recurring/projection.service.ts`; endpoint en módulo recurring |
| R6 | No-regresión + tests dedicados |
| R7 | Shape estable consumible por agente IA futuro |
