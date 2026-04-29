# Tasks: Cash Flow por Quincena con Cortes Configurables

**Input**: Design documents from `specs/010-biweekly-cashflow/`
**Prerequisites**: plan.md ✓ · spec.md ✓ · research.md ✓ · data-model.md ✓ · contracts/ ✓ · quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable.
- **[Story]**: US1 / US2 / US3 / US4.
- Rutas absolutas desde la raíz del repo.

---

## Phase 1: Setup

- [ ] **T001** Reverificar `npm audit --omit=dev` limpio en `backend/` y `frontend/`.

---

## Phase 2: Foundational (bloqueante para todas las US)

- [ ] **T002** Editar [backend/prisma/schema.prisma](backend/prisma/schema.prisma): añadir a `model User`:
  - `biweeklyCustomEnabled Boolean @default(false)`
  - `biweeklyStartDay1 Int?`
  - `biweeklyStartDay2 Int?`
- [ ] **T003** Aplicar el schema a la BD:
  ```bash
  docker exec finanzas-db psql -U finanzas_user -d finanzas_db -c "ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS \"biweeklyCustomEnabled\" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS \"biweeklyStartDay1\" INTEGER, ADD COLUMN IF NOT EXISTS \"biweeklyStartDay2\" INTEGER;"
  docker exec finanzas-backend npx prisma generate
  cd backend && npx prisma generate
  ```
- [ ] **T004** Crear [backend/src/utils/biweekly.ts](backend/src/utils/biweekly.ts) con:
  - `interface BiweeklyRange { start: Date; end: Date; label: string }`
  - `interface BiweeklyRanges { q1: BiweeklyRange; q2: BiweeklyRange }`
  - `computeBiweeklyRanges(month, year, mode, day1, day2): BiweeklyRanges` con los 3 casos (calendar/custom q1<q2/custom q1>q2) + `clamp` para días inexistentes.
  - `formatRangeLabel(start, end): string` ej. "30 abr – 14 may" en español.
- [ ] **T005** [P] Crear [frontend/src/utils/biweekly.ts](frontend/src/utils/biweekly.ts) espejo del backend (misma firma, misma lógica, misma salida).
- [ ] **T006** [P] Tests unitarios del helper backend en [backend/src/utils/biweekly.test.ts](backend/src/utils/biweekly.test.ts):
  - calendar default mayo 2026 → q1 1–15, q2 16–31.
  - custom 5/20 → q1 5–19, q2 20–31.
  - custom 30/15 mayo 2026 → q1 30 abr – 14 may, q2 15 may – 29 may.
  - custom 30/15 febrero 2026 → q1 30 ene – 14 feb, q2 15 feb – 28 feb (clamp).
  - custom 31/15 abril (30 días) → q1 30 mar – 14 abr (clamp en marzo), q2 15 abr – 30 abr (clamp en abril, 31→30).
  - q1=q2 → degrada a calendar.

---

## Phase 3: User Story 1 — Cash flow por quincena calendario default (P1)

**Goal**: usuario sin tocar settings ve sus Transactions reales agrupadas en Q1=1–15 y Q2=16–fin del mes.

**Independent Test**: registrar Transactions del 5 y 20 de mayo, abrir /budgets Quincenal, verificar bucket correcto.

### Backend

- [ ] **T007** [US1] Crear [backend/src/modules/cashflow/cashflow.schema.ts](backend/src/modules/cashflow/cashflow.schema.ts) con `biweeklyQuerySchema` (`month` 1–12, `year` 2000–2100, ambos `coerce.number`).
- [ ] **T008** [US1] Crear [backend/src/modules/cashflow/cashflow.service.ts](backend/src/modules/cashflow/cashflow.service.ts) con `getBiweeklyCashflow(userId, month, year)`:
  - Lee `User` para obtener `biweeklyCustomEnabled`, `biweeklyStartDay1`, `biweeklyStartDay2`.
  - Llama `computeBiweeklyRanges(month, year, mode, day1, day2)`.
  - Para cada bucket: query a `prisma.transaction.findMany` con filtro `userId` + `date` en rango, include category+account.
  - Calcula totales (INCOME/EXPENSE; TRANSFER excluido).
  - Devuelve shape de `BiweeklyCashflowResponse`.
- [ ] **T009** [US1] Crear [backend/src/modules/cashflow/cashflow.controller.ts](backend/src/modules/cashflow/cashflow.controller.ts) con `getBiweekly(req, res, next)`.
- [ ] **T010** [US1] Crear [backend/src/modules/cashflow/cashflow.routes.ts](backend/src/modules/cashflow/cashflow.routes.ts) con `GET /biweekly` + `validate({ query: biweeklyQuerySchema })` + JSDoc OpenAPI.
- [ ] **T011** [US1] Montar router en [backend/src/app.ts](backend/src/app.ts) en `/api/cashflow` detrás de `authMiddleware`.
- [ ] **T012** [US1] [P] Crear [backend/src/modules/cashflow/cashflow.test.ts](backend/src/modules/cashflow/cashflow.test.ts) cubriendo casos del contracts §"Tests cubiertos":
  - Default calendar: tx día 5 → Q1; día 20 → Q2.
  - Mes vacío → buckets en 0.
  - TRANSFER listada pero excluida de totales.
  - 401 sin token; 422 con mes inválido.
  - Aislamiento entre usuarios.

### Frontend

- [ ] **T013** [US1] [P] Crear [frontend/src/api/cashflow.api.ts](frontend/src/api/cashflow.api.ts) con `cashflowApi.getBiweekly({ month, year })`.
- [ ] **T014** [US1] [P] Editar [frontend/src/types/index.ts](frontend/src/types/index.ts):
  - Reemplazar tipos `BiweeklyProjection*` por `BiweeklyCashflow*` (Entry, Bucket, Response) según data-model §4.
  - Extender `User` con `biweeklyCustomEnabled`, `biweeklyStartDay1`, `biweeklyStartDay2`.
- [ ] **T015** [US1] Editar [frontend/src/components/budgets/BiweeklyTimeline.tsx](frontend/src/components/budgets/BiweeklyTimeline.tsx):
  - Cambiar import de `recurringApi.getProjection` a `cashflowApi.getBiweekly`.
  - Cambiar tipos a `BiweeklyCashflowResponse`.
  - El header del componente ya no dice "Proyección" → cambiar a "Cash flow por quincena" + descripción "Tus movimientos reales agrupados por quincena".
  - Cada `BucketCard` usa el `rangeLabel` que viene del backend en lugar de calcularlo localmente.
  - Quitar el badge "Solo una vez" — ya no aplica (no hay programados).
  - Mostrar `paymentMethod` o cuenta cuando relevante.
  - **F1**: Si todos los buckets están vacíos y el mes seleccionado es futuro respecto al mes actual, mostrar mensaje específico "Las transacciones de este mes aún no se han registrado. Programa tus pagos en Movimientos programados o consulta la vista Mensual para la proyección."
  - **F3**: Añadir a las deps del `useEffect` `user.biweeklyCustomEnabled`, `user.biweeklyStartDay1`, `user.biweeklyStartDay2` desde `useAuthStore` para refrescar tras cambios en `/settings`.
- [ ] **T016** [US1] [P] Test Vitest mínimo en [frontend/src/components/budgets/BiweeklyTimeline.test.tsx](frontend/src/components/budgets/BiweeklyTimeline.test.tsx): mock de respuesta calendar default → renderiza dos buckets, suma totales, muestra `rangeLabel`.

**Checkpoint**: ejecutar quickstart §A1.

---

## Phase 4: User Story 2 — Cortes personalizados (P1)

**Goal**: usuario configura Q1=30, Q2=15 en /settings y la vista usa esos cortes.

**Independent Test**: PUT profile con custom 30/15, GET cashflow para mayo → headers "30 abr – 14 may" y "15 may – 29 may".

### Backend

- [ ] **T017** [US2] Editar [backend/src/modules/users/users.schema.ts](backend/src/modules/users/users.schema.ts) `updateProfileSchema`:
  - Añadir campos opcionales `biweeklyCustomEnabled`, `biweeklyStartDay1`, `biweeklyStartDay2`.
  - `superRefine`: si `biweeklyCustomEnabled === true`, los días son requeridos, distintos, en 1–31.
- [ ] **T018** [US2] Editar [backend/src/modules/users/users.service.ts](backend/src/modules/users/users.service.ts):
  - `getProfile`: incluir los 3 campos en el `select`.
  - `updateProfile`: aceptar y persistir los 3 campos cuando vienen.
- [ ] **T019** [US2] [P] Editar [backend/src/modules/users/users.test.ts](backend/src/modules/users/users.test.ts) añadir casos:
  - PUT con custom enabled + 30/15 → 200, GET refleja.
  - PUT con custom enabled sin días → 422.
  - PUT con día1=día2 + custom enabled → 422.
  - PUT desactiva custom → 200, días pueden quedar.
  - PUT solo cambia `name` → biweekly fields inalterados (no-regresión).

### Frontend

- [ ] **T020** [US2] [P] Editar [frontend/src/api/users.api.ts](frontend/src/api/users.api.ts) si existe `updateProfile`: aceptar nuevos campos opcionales en el payload (puede ser solo extender el tipo, sin cambio de runtime si ya pasa el body completo).
- [ ] **T021** [US2] Editar [frontend/src/store/authStore.ts](frontend/src/store/authStore.ts) `updateUser` para que persista los 3 campos en el estado tras la respuesta.
- [ ] **T022** [US2] Editar [frontend/src/pages/SettingsPage.tsx](frontend/src/pages/SettingsPage.tsx) — añadir nueva tarjeta "Quincenas":
  - Icono `HiCalendarDays` (o similar) y título "Quincenas".
  - Toggle "Personalizar mis cortes de quincena" controlado por `user.biweeklyCustomEnabled`.
  - Si toggle on: dos `<input type="number" min=1 max=31>` o `<Select>` con label "Día de inicio Q1" y "Día de inicio Q2".
  - Validación cliente: días distintos, en rango 1–31, ambos presentes si custom on.
  - Botón "Guardar cambios de quincenas" llama a `usersApi.updateProfile({ biweeklyCustomEnabled, biweeklyStartDay1, biweeklyStartDay2 })`.
  - Texto bajo los selectores con preview en tiempo real (US4).
- [ ] **T023** [US2] [P] Test Vitest del Settings biweekly section en [frontend/src/pages/SettingsPage.test.tsx](frontend/src/pages/SettingsPage.test.tsx):
  - Toggle off → selectores ocultos.
  - Toggle on + 30/15 → tras click "Guardar" se llama a `usersApi.updateProfile` con esos valores.
  - Días iguales → mensaje de error inline, no llama al API.

**Checkpoint**: quickstart §A2 + §A5.

---

## Phase 5: User Story 3 — Edge cases de meses con días inválidos (P2)

**Goal**: si el corte no existe en el mes (ej. 30 en febrero), el sistema usa el último día disponible sin romper.

**Independent Test**: con custom 30/15, navegar a febrero → headers "30 ene – 14 feb" y "15 feb – 28 feb".

- [ ] **T024** [US3] Cubrir el caso de borde en `computeBiweeklyRanges` (helper). Esto ya está incluido en T004/T005, asegurar que los tests T006 incluyen los casos del data-model §5.
- [ ] **T025** [US3] [P] Test backend de integración del endpoint con custom 30/15 + febrero 2026 en [backend/src/modules/cashflow/cashflow.test.ts](backend/src/modules/cashflow/cashflow.test.ts) — verifica que `rangeLabel` y los días son los esperados.
- [ ] **T026** [US3] Validación cliente en SettingsPage: rechazar día fuera de 1–31. Backend ya lo valida vía Zod (T017), pero cliente da feedback inmediato.

**Checkpoint**: quickstart §A3 + §A6.

---

## Phase 6: User Story 4 — Vista previa en Settings (P2)

**Goal**: en /settings, mientras el usuario ajusta los selectores, ve en tiempo real qué rango cubrirá Q1 y Q2 para el mes actual.

**Independent Test**: cambiar selectores y ver el texto debajo actualizarse al instante sin guardar.

- [ ] **T027** [US4] En [frontend/src/pages/SettingsPage.tsx](frontend/src/pages/SettingsPage.tsx) sección Quincenas, debajo de los selectores:
  - Llamar `computeBiweeklyRanges` (importado de `frontend/src/utils/biweekly.ts`) con los valores actuales del estado del form + mes/año actuales.
  - Renderizar texto: "Para [mes] [año]: Primera quincena [rangeLabel q1]; Segunda quincena [rangeLabel q2]".
  - Usar `useMemo` para evitar recálculos innecesarios.
- [ ] **T028** [US4] [P] Test Vitest del preview en [frontend/src/pages/SettingsPage.test.tsx](frontend/src/pages/SettingsPage.test.tsx): cambiar selectores y verificar que el texto del preview cambia con valores esperados.

**Checkpoint**: quickstart §A4.

---

## Phase 7: Polish & cleanup (descontinuar legacy)

- [ ] **T029** [P] Eliminar [backend/src/modules/recurring/projection.service.ts](backend/src/modules/recurring/projection.service.ts).
- [ ] **T030** [P] Eliminar de [backend/src/modules/recurring/recurring.controller.ts](backend/src/modules/recurring/recurring.controller.ts) la función `getProjection` y su import.
- [ ] **T031** [P] Eliminar de [backend/src/modules/recurring/recurring.routes.ts](backend/src/modules/recurring/recurring.routes.ts) la ruta `GET /projection` y su JSDoc.
- [ ] **T032** [P] Eliminar de [backend/src/modules/recurring/recurring.schema.ts](backend/src/modules/recurring/recurring.schema.ts) `projectionQuerySchema` y `ProjectionQuery`.
- [ ] **T033** [P] Eliminar de [backend/src/modules/recurring/recurring.test.ts](backend/src/modules/recurring/recurring.test.ts) el `describe('GET /api/recurring/projection', ...)` completo.
- [ ] **T034** [P] Eliminar de [frontend/src/api/recurring.api.ts](frontend/src/api/recurring.api.ts) `getProjection` y su import.
- [ ] **T035** [P] `cd backend && npx tsc --noEmit` → 0 errores.
- [ ] **T036** [P] `cd frontend && npx tsc --noEmit` → 0 errores.
- [ ] **T037** [P] `cd backend && npx jest` → suite cashflow + biweekly + users 100%, sin regresiones nuevas (los fallos preexistentes documentados se mantienen).
- [ ] **T038** [P] `npm audit --omit=dev` en backend y frontend → 0 vulnerabilidades.
- [ ] **T039** Recorrer quickstart.md (A1–A7 + B1–B2 + C).
- [ ] **T040** Marcar `.specify/feature.json` como `status: implemented`.

---

## Dependencies & Execution Order

- **Phase 1**: precondición.
- **Phase 2 (T002–T006)**: bloqueante. T002 antes de T003. T004/T005/T006 paralelos tras T003.
- **Phase 3 (US1)**: backend (T007→T008→T009→T010→T011) secuencial; T012 en paralelo a T013–T016. T013/T014 paralelos. T015 depende de T013/T014. T016 paralelo con T017+.
- **Phase 4 (US2)**: T017→T018 secuencial; T019 paralelo. T020/T021/T022 paralelos tras T018. T023 paralelo con cualquier otra.
- **Phase 5 (US3)**: T024 ya cubierto en T004/T006; T025/T026 paralelos.
- **Phase 6 (US4)**: T027 depende de T005 y T022 (sección existe); T028 paralelo.
- **Phase 7 (cleanup)**: tras Phases 3–6 verdes. T029–T034 paralelos. T035/T036/T037/T038 paralelos.

## Parallel Opportunities

- T005 || T006 (helper espejo + tests).
- T012 || T013 || T014 || T016.
- T019 || T020 || T021 || T022 || T023.
- T029–T034 todos paralelos.
- T035–T038 paralelos.

## MVP Scope

Phases 1+2+3 entregan la corrección crítica (vista quincenal usa Transactions reales con cortes calendario). Phase 4 entrega la personalización. Phase 5 y 6 son polish.

## Total

- Setup: 1 · Foundational: 5 · US1: 10 · US2: 7 · US3: 3 · US4: 2 · Polish: 12 → **40 tareas**.
