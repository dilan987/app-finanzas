# Quickstart — Validar Movimientos Programados y Proyección Quincenal

## Requisitos

- Docker Compose levantado (DB+backend+frontend en puertos 5432/4000/3000).
- Migración `add_frequency_once` aplicada (Prisma `db push` o equivalente).

## A. Validación manual

### A1. Crear movimiento puntual (US1+US4)

1. Login con usuario test.
2. Sidebar → "Movimientos programados".
3. Botón "Nuevo movimiento".
4. Tipo: Gasto. Monto: 300000. Categoría: cualquiera. Fecha: 2026-05-23. Frecuencia: "Solo una vez".
5. Guardar → toast de éxito.
6. **Esperado**: el movimiento aparece en la lista. Filtro "Puntuales" lo muestra; "Repetitivos" no.

### A2. Ejecución de un puntual

1. (Opcional, requiere acceso al cron) Forzar `processRecurring` con un `ONCE` cuya fecha sea hoy.
2. **Esperado**: en `Transaction` aparece el movimiento real; el `RecurringTransaction` queda con `isActive=false`; la lista lo muestra con badge "Ejecutado".

### A3. Proyección por quincena (US2)

1. Crear varios movimientos:
   - Ingreso MONTHLY el día 1.
   - Ingreso MONTHLY el día 15.
   - Gasto BIWEEKLY el día 5 (genera ocurrencias en Q1 y Q2).
   - Gasto ONCE el día 23.
2. Ir a "Presupuestos" → seleccionar el mes correspondiente.
3. **Esperado**: aparece la sección "Proyección por quincena" con dos columnas:
   - **Primera quincena (1–15)**: ingreso día 1, gasto día 5, ingreso día 15. Totales: ingresos = suma de los dos, gastos = monto del BIWEEKLY, balance neto = diferencia.
   - **Segunda quincena (16–fin)**: gasto día 23 (ONCE) + segunda ocurrencia BIWEEKLY (día 19). Totales reflejan eso. Balance neto correcto.
4. Cambiar el mes con el `MonthSelector`. **Esperado**: la vista actualiza al nuevo mes.

### A4. Filtros (US3)

1. En "Movimientos programados", probar los tres filtros: Todos / Repetitivos / Puntuales.
2. **Esperado**: cada filtro muestra el subconjunto correcto. Movimientos inactivos (puntuales ya ejecutados) tienen badge "Ejecutado".

### A5. Renombrado de UI (US3 / FR-005)

1. Sidebar y BottomTabBar muestran el item "Movimientos programados" (no "Recurrentes").
2. La página tiene como título "Movimientos programados".

### A6. Form (US4)

1. En el form, abrir el selector de frecuencia.
2. **Esperado**: las opciones son: Diario, Semanal, Quincenal, Mensual, Anual, Solo una vez.
3. Seleccionar "Solo una vez": aparece hint "Se ejecutará una sola vez en esta fecha".
4. Elegir una fecha pasada → advertencia visible (no bloqueante).

## B. Validación automatizada

### B1. Backend (Jest + Supertest)

```bash
cd backend && npm run test -- recurring
```

Tests esperados (ver contracts §3):
- Creación con `ONCE` válido.
- Ejecución de `ONCE`: `isActive=false`, `nextExecutionDate` intacto, `Transaction` creada.
- Ejecución de `MONTHLY`: comportamiento intacto.
- Endpoint `/projection`: casos de Q1, Q2, mes vacío, repetitivo con múltiples ocurrencias, `ONCE` inactivo no aparece.
- Aislamiento por usuario.
- 401 sin token.

### B2. Frontend (Vitest + RTL)

```bash
cd frontend && npm run test -- biweekly
```

- `BiweeklyTimeline` renderiza dos buckets, suma totales, muestra estado vacío.
- `RecurringPage`: filtro "Puntuales" oculta repetitivos.
- `FREQUENCIES` incluye `ONCE` en último orden.

## C. Verificación de constitución

```bash
cd backend && npm audit --omit=dev
cd frontend && npm audit --omit=dev
```

Ambos deben reportar `0 vulnerabilities`.

## D. Criterios de éxito (referencia)

SC-001 a SC-007 quedan validados con A1–A6 y B1–B2 sin regresiones (suite recurring del backend pasa al 100%).
