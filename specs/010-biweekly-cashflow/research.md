# Phase 0 — Research: Cash Flow Quincenal Configurable

## R1 · Algoritmo de cálculo de rangos

**Decisión**: función `computeBiweeklyRanges(month, year, mode, day1?, day2?)` que devuelve dos `{ start: Date, end: Date }` (UTC midnight inclusive en `start`, end-of-day inclusive en `end`).

```ts
function computeBiweeklyRanges(month, year, mode, day1, day2) {
  if (mode === 'calendar') {
    return {
      q1: range(year, month, 1, year, month, 15),
      q2: range(year, month, 16, year, month, lastDay(year, month)),
    };
  }
  // mode === 'custom'
  if (day1 < day2) {
    return {
      q1: range(year, month, day1, year, month, day2 - 1),
      q2: range(year, month, day2, year, month, lastDay(year, month)),
    };
  }
  // day1 > day2 (caso típico: 30/15)
  const prev = previousMonth(month, year);
  return {
    q1: range(prev.year, prev.month, clamp(day1, prev.year, prev.month),
              year, month, day2 - 1),
    q2: range(year, month, day2, year, month, clamp(day1 - 1, year, month)),
  };
}
```

`clamp(day, year, month)` devuelve `min(day, lastDay(year, month))` para manejar febrero, etc.

**Rationale**: cubre los tres casos del spec sin ramificaciones complicadas. La función es pura, fácil de testear con casos como "mayo 2026 + custom 30/15 → Q1 30 abr–14 may, Q2 15 may–29 may".

**Alternativas consideradas**:
- Usar timezone-aware libs (date-fns/luxon): rechazado, agregaría dependencia y para fechas calendario UTC midnight es suficiente.
- Pre-calcular todos los meses del año: rechazado, sin valor.

## R2 · Días de corte que no existen en el mes

**Decisión**: aplicar `clamp` siempre que se construya un `Date` con `(year, month, day)`. Si `day > lastDay(year, month)`, usar `lastDay(year, month)`.

Casos cubiertos:
- Febrero 2026 (28 días) + corte day1=30 → la "Primera quincena" inicia el día 30 del mes anterior (enero, que sí tiene 30+) y termina el día 14 del mes seleccionado (febrero, sí existe).
- Si se calcula la "Segunda quincena" de febrero con day1=30 (corte de Q2 fin), `clamp(29, 2026, 2)` = 28 → Q2 cubre del 15 al 28.
- Mes de 30 días + corte day1=31 → `clamp(31, year, month)` = 30, así que la "Q1" del mes anterior se ajusta a su último día.

**Rationale**: degradación gracefull. Garantiza que `start <= end` siempre.

## R3 · Helper compartido cliente/servidor

**Decisión**: dos archivos espejo:
- `backend/src/utils/biweekly.ts`
- `frontend/src/utils/biweekly.ts`

Mismo nombre de funciones, misma firma, misma lógica. Sin extracción a un paquete compartido (overkill para 30 líneas de lógica pura).

**Validación**: tests del helper en backend cubren la lógica; un test mínimo en frontend verifica que el output coincide con casos representativos.

**Rationale**: el preview en Settings necesita renderizar el rango sin llamada al backend. Llamar al backend en cada cambio del selector sería innecesariamente costoso.

**Alternativas consideradas**:
- Workspace package `@finanzas/shared`: overkill, impacto de configuración tooling.
- Endpoint preview: latencia, consumo, complejidad sin valor.
- Calcular preview siempre con el endpoint real: rechazado, blanquearía la UI mientras el usuario escribe.

## R4 · Extensión del endpoint de profile vs endpoint dedicado

**Decisión**: extender `GET /api/users/profile` y `PUT /api/users/profile` para incluir/aceptar los 3 campos nuevos (`biweeklyCustomEnabled`, `biweeklyStartDay1`, `biweeklyStartDay2`).

**Rationale**: la config quincenal es una preferencia del usuario, así como `mainCurrency` y `timezone`. Tratarla igual reduce superficie de API y evita endpoints proliferantes. Validación Zod refinada (si custom enabled, los días son requeridos, distintos, en rango 1–31).

**Alternativas consideradas**:
- Endpoint dedicado `/api/users/biweekly-config`: más cirugía sin valor neto.

## R5 · Eliminación del endpoint legacy `/api/recurring/projection`

**Decisión**: eliminar el endpoint, su controller, su service (`projection.service.ts`), su test y la entrada en `recurring.routes.ts`. También limpiar `recurringApi.getProjection` y los tipos `BiweeklyProjectionResponse` que ya no aplican (re-tipados en `frontend/src/types/index.ts` para el nuevo endpoint).

**Rationale**: nadie consume el endpoint viejo después de migrar `BiweeklyTimeline`. Mantenerlo es deuda técnica y sigue mostrando datos engañosos (programados sin ejecutar). Constitución VII (DRY) penaliza código duplicado.

**Alternativas consideradas**:
- Mantener legacy con `@deprecated`: rechazado, nadie lo va a consumir.
- Reemplazar in-place el contenido del legacy: rechazado, conceptualmente cambia el módulo (de `recurring` a `cashflow`/`transactions`).

## R6 · Renombrado de la sección visual

**Decisión**: en `BiweeklyTimeline.tsx` cambiar el `<h2>` de "Proyección por quincena" a "Cash flow por quincena" y la descripción a algo como "Tus movimientos reales agrupados por quincena". El nombre del componente en código se conserva (`BiweeklyTimeline`).

**Rationale**: el nombre interno del componente no es user-facing. Cambiarlo en archivo implica refactor de imports sin valor.

## R7 · Tratamiento de transferencias (`TRANSFER`)

**Decisión**: las transferencias se listan en su quincena con tipo `TRANSFER` pero NO contribuyen a `totalIncome` ni `totalExpense`. El balance neto se calcula solo con INCOME y EXPENSE. Coincide con el comportamiento ya establecido en otros módulos.

## R8 · Endpoint de cashflow: incluir cuenta y categoría en respuesta

**Decisión**: el endpoint devuelve por cada Transaction: id, date, type, amount, description, category {id, name, color, icon}, account {id, name}, paymentMethod. Mismo shape que `BiweeklyProjectionEntry` viejo más el `paymentMethod` (que en el legacy faltaba para Transactions reales).

**Rationale**: el frontend ya sabe renderizar este shape. Reutilizamos los mismos componentes visuales.

## Resumen

| ID | Decisión |
|----|----------|
| R1 | Función pura `computeBiweeklyRanges` con tres casos |
| R2 | `clamp(day, year, month)` para días inexistentes |
| R3 | Helper espejo backend+frontend (sin paquete compartido) |
| R4 | Extender profile endpoint, no crear uno nuevo |
| R5 | Eliminar `/api/recurring/projection` y código relacionado |
| R6 | Renombrar headers en UI sin tocar nombre de componente |
| R7 | Transferencias listadas pero excluidas de totales |
| R8 | Shape de respuesta consistente con la vista existente |
