# Tasks: Movimientos Programados y Proyección por Quincena

**Input**: Design documents from `specs/009-scheduled-movements/`
**Prerequisites**: plan.md ✓ · spec.md ✓ · research.md ✓ · data-model.md ✓ · contracts/projection-api.md ✓ · quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos distintos sin dependencia).
- **[Story]**: US1 / US2 / US3 / US4.
- Rutas absolutas desde la raíz del repo.

---

## Phase 1: Setup

- [ ] **T001** Reverificar `npm audit --omit=dev` limpio en `backend/` y `frontend/` antes de tocar nada (constitución V).

---

## Phase 2: Foundational (bloqueante para todas las US)

- [ ] **T002** Editar [backend/prisma/schema.prisma](backend/prisma/schema.prisma): añadir `ONCE` al `enum Frequency`.
- [ ] **T003** Aplicar el cambio de schema en la BD vía `prisma db push` (o migrate dev) y regenerar Prisma Client en backend host y contenedor:
  ```bash
  docker exec finanzas-backend npx prisma db push
  docker exec finanzas-backend npx prisma generate
  cd backend && npx prisma generate
  ```
- [ ] **T004** [P] Editar [backend/src/modules/recurring/recurring.schema.ts](backend/src/modules/recurring/recurring.schema.ts): añadir `'ONCE'` al enum de `frequency` en `createRecurringSchema` y `updateRecurringSchema`.
- [ ] **T005** [P] Editar [frontend/src/utils/constants.ts](frontend/src/utils/constants.ts): añadir `{ value: 'ONCE', label: 'Solo una vez' }` al final de `FREQUENCIES`.
- [ ] **T006** [P] Editar [frontend/src/types/index.ts](frontend/src/types/index.ts): extender el union `Frequency` con `| 'ONCE'`.

**Checkpoint**: enum y tipos sincronizados; las US se pueden implementar.

---

## Phase 3: User Stories 1 y 4 — Crear y ejecutar movimientos puntuales (P1)

**Goal**: el usuario puede crear un movimiento `ONCE` y al ejecutarse queda inactivo automáticamente.

**Independent Test**: crear vía API `POST /api/recurring` con `frequency=ONCE` y fecha hoy, ejecutar `processRecurring`, verificar `Transaction` creada y `RecurringTransaction.isActive=false`.

### Backend

- [ ] **T007** [US1] En [backend/src/modules/recurring/recurring.service.ts](backend/src/modules/recurring/recurring.service.ts) `processRecurring`: tras crear la `Transaction` y ajustar saldo, si `recurring.frequency === 'ONCE'` actualizar `isActive: false` (NO calcular `nextExecutionDate`); para todas las demás frecuencias mantener el comportamiento actual.
- [ ] **T008** [US1] En el mismo archivo, tipar `calculateNextExecutionDate(currentDate: Date, frequency: Exclude<Frequency, 'ONCE'>)`. `processRecurring` filtra explícitamente antes de llamar (si `ONCE` desactiva sin recalcular fecha). (Resolución F3 del análisis.)
- [ ] **T009** [US1] [P] En [backend/src/modules/recurring/recurring.test.ts](backend/src/modules/recurring/recurring.test.ts) añadir tests:
  - POST con `frequency=ONCE` y fecha válida → 201 y persistido.
  - `processRecurring` con un `ONCE` activo cuya fecha ya pasó → `Transaction` creada, `RecurringTransaction.isActive=false`, `nextExecutionDate` intacto.
  - `processRecurring` con un `MONTHLY` → comportamiento intacto (no-regresión).

### Frontend

- [ ] **T010** [US4] [P] En [frontend/src/pages/RecurringPage.tsx](frontend/src/pages/RecurringPage.tsx) form: cuando `frequency === 'ONCE'` mostrar bajo el selector un texto pequeño "Se ejecutará una sola vez en esta fecha".
- [ ] **T011** [US4] [P] En el mismo form: si `frequency === 'ONCE'` y `nextExecutionDate < hoy`, mostrar un alert visual (no bloqueante, no `disabled`) "La fecha es pasada; el movimiento se ejecutará en la próxima corrida del proceso".
- [ ] **T012** [US4] [P] En [frontend/src/api/recurring.api.ts](frontend/src/api/recurring.api.ts) verificar que `create`/`update` aceptan `frequency: 'ONCE'` por el tipo (gracias a T006). Si hay un `Pick`/`Omit` que excluya `ONCE`, ajustar.

**Checkpoint**: ejecutar quickstart §A1 + §A2 + §A6.

---

## Phase 4: User Story 2 — Proyección por quincena (P1)

**Goal**: la sección Presupuestos muestra la proyección agrupada por quincena del mes seleccionado.

**Independent Test**: crear movimientos en varias fechas (1, 5, 15, 16, 23), llamar `GET /api/recurring/projection?month=&year=`, verificar buckets correctos y totales.

### Backend

- [ ] **T013** [US2] Crear [backend/src/modules/recurring/projection.service.ts](backend/src/modules/recurring/projection.service.ts) con función `getProjection(userId, month, year)` que implementa el algoritmo de [data-model.md §4](specs/009-scheduled-movements/data-model.md#4-reglas-de-proyección-por-movimiento). Reutilizar `calculateNextExecutionDate` (exportarla si está privada).
- [ ] **T014** [US2] Editar [backend/src/modules/recurring/recurring.controller.ts](backend/src/modules/recurring/recurring.controller.ts): añadir `getProjection(req, res, next)` que parsea query y delega a `projection.service`.
- [ ] **T015** [US2] Editar [backend/src/modules/recurring/recurring.schema.ts](backend/src/modules/recurring/recurring.schema.ts): añadir `projectionQuerySchema` (month 1–12, year 2000–2100, ambos `coerce.number`).
- [ ] **T016** [US2] Editar [backend/src/modules/recurring/recurring.routes.ts](backend/src/modules/recurring/recurring.routes.ts): añadir `GET /projection` con `validate({ query: projectionQuerySchema })` + JSDoc OpenAPI.
- [ ] **T017** [US2] [P] En [backend/src/modules/recurring/recurring.test.ts](backend/src/modules/recurring/recurring.test.ts) añadir tests del endpoint:
  - Mes vacío → buckets en cero.
  - `MONTHLY` con día 5 → en Q1.
  - `MONTHLY` con día 20 → en Q2.
  - `WEEKLY` con `nextExecutionDate=día 1` → 4–5 ocurrencias correctamente repartidas Q1/Q2.
  - `BIWEEKLY` con día 5 → 1 ocurrencia en Q1 y 1 en Q2 (día 19).
  - `ONCE` activo con fecha en el mes → aparece una sola vez en el bucket correcto.
  - `ONCE` inactivo → no aparece.
  - 401 sin token; aislamiento usuario A vs B.

### Frontend

- [ ] **T018** [US2] [P] En [frontend/src/api/recurring.api.ts](frontend/src/api/recurring.api.ts) añadir `getProjection({ month, year })`.
- [ ] **T019** [US2] [P] En [frontend/src/types/index.ts](frontend/src/types/index.ts) añadir interfaces `BiweeklyProjectionEntry`, `BiweeklyBucket`, `BiweeklyProjectionResponse` según `data-model.md §3`.
- [ ] **T020** [US2] Crear [frontend/src/components/budgets/BiweeklyTimeline.tsx](frontend/src/components/budgets/BiweeklyTimeline.tsx):
  - Recibe `month`, `year` por props.
  - Llama `recurringApi.getProjection({month,year})` con `useEffect`.
  - Renderiza dos cards/columnas (Q1 y Q2) con: header (rango de días), totales (ingresos / gastos / neto), lista de entries con fecha, descripción, monto, categoría (color/icon), badge `ONCE` si aplica.
  - Estado vacío amigable cuando `entries.length===0` (no romper).
  - Skeleton mientras carga.
  - Adaptado a dark/light vía tokens existentes.
  - Responsive: en móvil las dos cards apiladas; en desktop, lado a lado.
- [ ] **T021** [US2] Integrar `<BiweeklyTimeline />` en [frontend/src/pages/BudgetsPage.tsx](frontend/src/pages/BudgetsPage.tsx) debajo del resumen actual; pasarle `currentMonth` y `currentYear` del `useUiStore`.
- [ ] **T022** [US2] [P] Test Vitest mínimo en `frontend/src/components/budgets/BiweeklyTimeline.test.tsx`: con un response mock, suma totales correctamente y muestra el badge `ONCE`.

**Checkpoint**: ejecutar quickstart §A3 manual + B1/B2.

---

## Phase 5: User Story 3 — Renombrado y filtros (P2)

**Goal**: la sección queda renombrada "Movimientos programados" con filtros Todos / Repetitivos / Puntuales.

**Independent Test**: en la página, cambiar entre los tres filtros y validar que el listado refleja el subconjunto correcto.

- [ ] **T023** [US3] [P] [frontend/src/components/layout/Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx): cambiar label `'Recurrentes'` → `'Movimientos programados'` (mantener path `/recurring`).
- [ ] **T024** [US3] [P] [frontend/src/components/layout/BottomTabBar.tsx](frontend/src/components/layout/BottomTabBar.tsx): mismo cambio de label.
- [ ] **T025** [US3] [frontend/src/pages/RecurringPage.tsx](frontend/src/pages/RecurringPage.tsx): cambiar título `<h1>` y descripción a "Movimientos programados" + texto reflejando que cubre repetitivos y puntuales.
- [ ] **T026** [US3] En la misma página añadir un filtro local (chips o tabs) con tres estados: `'all'` (default), `'repeating'` (frecuencia ≠ ONCE), `'once'` (frecuencia = ONCE). Aplicar `Array.filter` sobre `items` antes de renderizar.
- [ ] **T027** [US3] En la misma página, mostrar badge "Ejecutado" cuando `frequency === 'ONCE'` y `isActive === false`.
- [ ] **T028** [US3] [P] Test Vitest en `frontend/src/pages/RecurringPage.test.tsx`: con mock de items mixtos, el filtro "Puntuales" oculta los repetitivos.

**Checkpoint**: quickstart §A4 + §A5.

---

## Phase 6: Polish & cross-cutting

- [ ] **T029** [P] `cd backend && npx tsc --noEmit` → 0 errores.
- [ ] **T030** [P] `cd frontend && npx tsc --noEmit` → 0 errores.
- [ ] **T031** [P] `cd backend && npx jest` → suite recurring 100%; sin regresiones nuevas en otras suites (los fallos preexistentes documentados al inicio se mantienen).
- [ ] **T032** [P] `npm audit --omit=dev` en backend y frontend → 0 vulnerabilidades.
- [ ] **T033** Recorrer `quickstart.md` (A1–A6 + B1/B2) y registrar resultados.
- [ ] **T034** Marcar `.specify/feature.json` como `status: implemented`.

---

## Dependencies & Execution Order

- **Phase 1 (T001)**: precondición.
- **Phase 2 (T002–T006)**: bloqueante de Phase 3+. T002 antes de T003 (schema cambia primero, push después). T004/T005/T006 pueden ir en paralelo después de T003.
- **Phase 3 (US1+US4)**: T007 depende de T002-T003. T008 depende de T007. T009 depende de T007. T010/T011/T012 pueden ir en paralelo entre sí y con T007–T009.
- **Phase 4 (US2)**: T013 depende de T002-T003. T014 depende de T013, T015. T016 depende de T015. T017 depende de T013–T016. Frontend (T018–T022) puede empezar en paralelo a backend (T018/T019 independientes).
- **Phase 5 (US3)**: independiente de Phase 4 — solo depende de Phase 2.
- **Phase 6**: depende de Phases 3–5.

## Parallel Opportunities

- T004, T005, T006 paralelos (archivos distintos).
- T009 paralelo con T010–T012.
- T017 paralelo con T020–T022.
- T023, T024 paralelos con T028.
- T029–T032 paralelos.

## MVP Scope

Phases 1+2+3+4 entregan la funcionalidad core (crear `ONCE`, ejecutarlo, ver proyección quincenal). Phase 5 (renombrar + filtros) puede empujarse a iteración inmediata sin bloquear release.

## Total

- Setup: 1 · Foundational: 5 · US1+US4: 6 · US2: 10 · US3: 6 · Polish: 6 → **34 tareas**.
