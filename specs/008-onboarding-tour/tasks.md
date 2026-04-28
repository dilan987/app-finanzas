# Tasks: Tour de Onboarding Interactivo

**Input**: Design documents from `specs/008-onboarding-tour/`
**Prerequisites**: plan.md ✓ · spec.md ✓ · research.md ✓ · data-model.md ✓ · contracts/onboarding-api.md ✓ · quickstart.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias).
- **[Story]**: US1 / US2 / US3 / US4 / US5 según historia de la spec.
- Todas las rutas son absolutas desde la raíz del repo.

---

## Phase 1: Setup (infraestructura compartida)

- [ ] **T001** Verificar `npm audit` limpio en `backend/` y `frontend/` antes de tocar nada (constitución V).
  ```bash
  cd backend && npm audit --omit=dev
  cd frontend && npm audit --omit=dev
  ```
  Si reporta vulnerabilidades preexistentes, corregir como tarea separada antes de continuar.
- [ ] **T002** [P] Instalar dependencias frontend nuevas y revalidar audit:
  ```bash
  cd frontend && npm install @floating-ui/react react-focus-lock && npm audit --omit=dev
  ```
  Si aparece CVE, replantear según `research.md §R2`.
- [ ] **T003** [P] Crear directorios:
  - `backend/src/modules/onboarding/`
  - `frontend/src/components/onboarding/`

---

## Phase 2: Foundational (bloqueante para todas las US)

- [ ] **T004** Editar [backend/prisma/schema.prisma](backend/prisma/schema.prisma):
  - Añadir `enum TourStatus { NOT_STARTED COMPLETED SKIPPED }`.
  - Añadir a `model User`: `tourStatus TourStatus @default(NOT_STARTED)`, `tourVersion String?`, `tourUpdatedAt DateTime?`.
- [ ] **T005** Generar y aplicar migración:
  ```bash
  docker exec -it <backend> npx prisma migrate dev --name add_user_tour_state
  docker exec -it <backend> npx prisma generate
  ```
- [ ] **T006** [P] Crear [frontend/src/types/onboarding.ts](frontend/src/types/onboarding.ts) con tipos `TourStatus`, `TourStep`, `TourStepCta`, `TourStepContext`, `TourStepPlacement`, `OnboardingStateResponse` (alineados con `data-model.md §3` y `contracts/onboarding-api.md §1`).

**Checkpoint**: schema migrado, tipos compartidos disponibles. A partir de aquí pueden arrancar las US en paralelo cuando sus dependencias internas lo permitan.

---

## Phase 3: User Story 1 — Tour automático en primer login (P1)

**Goal**: usuario nuevo entra y ve el tour automáticamente desde el dashboard, recorre los 12 pasos, finaliza y queda persistido.

**Independent Test**: registrar usuario, login, verificar tour automático y al "Finalizar" persiste `tourStatus=COMPLETED, tourVersion="1"`.

### Backend (módulo `onboarding`)

- [ ] **T007** [US1] Crear [backend/src/modules/onboarding/onboarding.schema.ts](backend/src/modules/onboarding/onboarding.schema.ts) con `patchTourSchema` Zod (status enum + version optional/nullable).
- [ ] **T008** [US1] Crear [backend/src/modules/onboarding/onboarding.service.ts](backend/src/modules/onboarding/onboarding.service.ts) con `getTourState(userId)` y `updateTourState(userId, { status, version })`. Reglas:
  - status `NOT_STARTED` → `version=null`.
  - status `COMPLETED` o `SKIPPED` → `version` requerido (lanzar `ValidationError` si falta).
  - `tourUpdatedAt = new Date()` siempre que cambie.
- [ ] **T009** [US1] Crear [backend/src/modules/onboarding/onboarding.controller.ts](backend/src/modules/onboarding/onboarding.controller.ts) con `getTour` y `updateTour` que delegan al service y responden con `apiResponse`.
- [ ] **T010** [US1] Crear [backend/src/modules/onboarding/onboarding.routes.ts](backend/src/modules/onboarding/onboarding.routes.ts):
  - `GET /tour` → `getTour`
  - `PATCH /tour` → `validate({ body: patchTourSchema })` + `updateTour`
  - JSDoc OpenAPI siguiendo el estilo de `users.routes.ts`.
- [ ] **T011** [US1] Montar router en [backend/src/app.ts](backend/src/app.ts) en `/api/onboarding` detrás del middleware de autenticación, igual que el resto de módulos protegidos.
- [ ] **T012** [P] [US1] Crear [backend/src/modules/onboarding/onboarding.test.ts](backend/src/modules/onboarding/onboarding.test.ts) cubriendo los 8 casos de `contracts/onboarding-api.md §4`.

### Frontend (estado, API y motor del tour)

- [ ] **T013** [P] [US1] Crear [frontend/src/api/onboarding.ts](frontend/src/api/onboarding.ts) con `getTourState()` y `updateTourState({ status, version })` apuntando a `/api/onboarding/tour`.
- [ ] **T014** [P] [US1] Crear [frontend/src/utils/tourSteps.ts](frontend/src/utils/tourSteps.ts) con `TOUR_VERSION = "1"` y los 12 pasos (`data-model.md §5`). Mensajes en español.
- [ ] **T015** [US1] Crear [frontend/src/store/onboardingStore.ts](frontend/src/store/onboardingStore.ts) (Zustand) con la forma de `data-model.md §4`. Sin persistencia local.
- [ ] **T016** [US1] Crear [frontend/src/hooks/useOnboardingTour.ts](frontend/src/hooks/useOnboardingTour.ts):
  - Al montar, llama `hydrateFromServer` (lee `GET /api/onboarding/tour`).
  - Si `status === 'NOT_STARTED'` o `version !== TOUR_VERSION` → `open()`.
  - Expone `restart()` para Settings.
- [ ] **T017** [P] [US1] Crear [frontend/src/components/onboarding/TourSpotlight.tsx](frontend/src/components/onboarding/TourSpotlight.tsx): overlay SVG en portal con agujero por `getBoundingClientRect`, padding configurable, animado con Motion 12.
- [ ] **T018** [US1] Crear [frontend/src/components/onboarding/TourCard.tsx](frontend/src/components/onboarding/TourCard.tsx):
  - `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`.
  - Focus trap con `react-focus-lock`.
  - Posicionamiento con `@floating-ui/react` (`flip`, `shift`, `offset(12)`, `autoUpdate`).
  - Tema dark/light vía tokens Tailwind ya en uso.
  - Botones "Saltar", "Anterior" (deshabilitado en paso 1), "Siguiente"/"Finalizar".
  - Indicador "Paso N de 12".
  - Slot opcional para `cta` (acción "Crear mi primera cuenta" — implementación detallada en US4 paso 3).
- [ ] **T019** [US1] Crear [frontend/src/components/onboarding/TourProvider.tsx](frontend/src/components/onboarding/TourProvider.tsx):
  - Lee step actual del store + ruta actual; si difieren, navega.
  - Polling con `requestAnimationFrame` (≤30 frames) para encontrar el ancla; si no, degrada a `placement='center'`.
  - Listener global `Esc` → `close('skipped')`.
  - Respeta `useReducedMotion`.
- [ ] **T020** [US1] Crear barrel [frontend/src/components/onboarding/index.ts](frontend/src/components/onboarding/index.ts) exportando `TourProvider`.
- [ ] **T021** [US1] Montar `<TourProvider />` dentro de [frontend/src/components/layout/MainLayout.tsx](frontend/src/components/layout/MainLayout.tsx) (renderiza solo bajo rutas protegidas; sin afectar a `AuthLayout`).
- [ ] **T022** [US1] Disparar `useOnboardingTour()` desde `MainLayout` para que se hidrate al primer render post-login.

### Anclas en páginas (necesarias para que el tour pueda apuntar a algo real)

> Cada tarea añade un atributo `data-tour="..."` a un nodo existente (sin cambiar lógica). Son paralelizables entre sí porque tocan archivos distintos.

- [ ] **T023** [P] [US1] [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx): `data-tour="dashboard-summary"` en el contenedor del resumen principal.
- [ ] **T024** [P] [US1] [frontend/src/pages/AccountsPage.tsx](frontend/src/pages/AccountsPage.tsx): `data-tour="accounts-list"` en la lista/grid de cuentas.
- [ ] **T025** [P] [US1] [frontend/src/pages/CategoriesPage.tsx](frontend/src/pages/CategoriesPage.tsx): `data-tour="categories-list"`.
- [ ] **T026** [P] [US1] [frontend/src/pages/TransactionsPage.tsx](frontend/src/pages/TransactionsPage.tsx): `data-tour="transactions-create"` en el botón principal de crear transacción.
- [ ] **T027** [P] [US1] [frontend/src/pages/BudgetsPage.tsx](frontend/src/pages/BudgetsPage.tsx): `data-tour="budgets-list"`.
- [ ] **T028** [P] [US1] [frontend/src/pages/RecurringPage.tsx](frontend/src/pages/RecurringPage.tsx): `data-tour="recurring-list"`.
- [ ] **T029** [P] [US1] [frontend/src/pages/GoalsPage.tsx](frontend/src/pages/GoalsPage.tsx): `data-tour="goals-list"`.
- [ ] **T030** [P] [US1] [frontend/src/pages/InvestmentsPage.tsx](frontend/src/pages/InvestmentsPage.tsx): `data-tour="investments-list"`.
- [ ] **T031** [P] [US1] [frontend/src/pages/AnalyticsPage.tsx](frontend/src/pages/AnalyticsPage.tsx): `data-tour="analytics-charts"` en el contenedor de charts.
- [ ] **T032** [P] [US1] [frontend/src/pages/ReportsPage.tsx](frontend/src/pages/ReportsPage.tsx): `data-tour="reports-export"` en el botón de exportar.

**Checkpoint**: tras T007–T032, US1 funcional end-to-end. Ejecutar quickstart §A1 y §A2.

---

## Phase 4: User Story 2 — Saltar el tour (P1)

**Goal**: cualquier paso permite saltar (botón o `Esc`); el estado se persiste como `SKIPPED` y no reaparece automáticamente.

**Independent Test**: iniciar tour como usuario nuevo, pulsar "Saltar" en paso 3 → tour cierra; relogin no lo reabre; BD `tourStatus='SKIPPED'`.

- [ ] **T033** [US2] En [frontend/src/store/onboardingStore.ts](frontend/src/store/onboardingStore.ts): implementar `close(reason)` que llama a `updateTourState({ status: reason === 'completed' ? 'COMPLETED' : 'SKIPPED', version: TOUR_VERSION })` y luego limpia `isOpen`/`currentStepIndex`.
- [ ] **T034** [US2] En [frontend/src/components/onboarding/TourCard.tsx](frontend/src/components/onboarding/TourCard.tsx): wirear botón "Saltar" → `close('skipped')`. Confirmar que el listener global `Esc` ya añadido en T019 invoca el mismo path.
- [ ] **T035** [P] [US2] Test Vitest: simular click en "Saltar" → mock de la API recibe `{ status:'SKIPPED', version:'1' }`. Archivo: `frontend/src/components/onboarding/TourCard.test.tsx`.
- [ ] **T036** [P] [US2] Test Vitest: keyDown `Escape` cierra el tour con `reason='skipped'`. Mismo archivo o nuevo `TourProvider.test.tsx`.

**Checkpoint**: ejecutar quickstart §A3.

---

## Phase 5: User Story 3 — Reiniciar desde Settings (P2)

**Goal**: control en Settings que vuelve a abrir el tour desde el paso 1.

**Independent Test**: usuario con `tourStatus='COMPLETED'` pulsa "Reiniciar tour" en `/settings` → es redirigido a `/dashboard` y el tour se abre desde el paso 1.

- [ ] **T037** [US3] En [frontend/src/store/onboardingStore.ts](frontend/src/store/onboardingStore.ts): implementar `restart()` que llama `updateTourState({ status: 'NOT_STARTED' })`, resetea `currentStepIndex=0`, y abre.
- [ ] **T038** [US3] Editar [frontend/src/pages/SettingsPage.tsx](frontend/src/pages/SettingsPage.tsx): añadir sección "Onboarding" con descripción breve y botón "Reiniciar tour de bienvenida". Al click: `restart()` y `navigate('/dashboard')`.
- [ ] **T039** [P] [US3] Test Vitest del botón en SettingsPage: tras click, el store queda con `isOpen=true`, `currentStepIndex=0`. Archivo: `frontend/src/pages/SettingsPage.test.tsx` (extender o crear).

**Checkpoint**: ejecutar quickstart §A4.

---

## Phase 6: User Story 4 — Recorrido completo y CTA condicional (P1)

**Goal**: los 12 pasos se navegan en orden, navegan entre rutas, anclan correctamente, y el paso de Cuentas muestra CTA solo si el usuario no tiene cuentas.

**Independent Test**: recorrer manualmente del paso 1 al 12 con "Siguiente"; en el paso 3 (Cuentas), si `accountStore` está vacío, aparece el botón "Crear mi primera cuenta" que abre el modal de creación; si ya hay cuentas, aparece mensaje informativo sin CTA.

- [ ] **T040** [US4] En [frontend/src/store/accountStore.ts](frontend/src/store/accountStore.ts): exponer una acción imperativa `openCreateAccountModal()` (o similar) y un flag observable que `AccountsPage` ya consuma para abrir su modal. Si ya existe un mecanismo equivalente, reutilizar y documentar.
- [ ] **T041** [US4] En [frontend/src/utils/tourSteps.ts](frontend/src/utils/tourSteps.ts): para el paso `accounts-intro`, definir `cta`:
  - `label: 'Crear mi primera cuenta'`
  - `action: 'create-account'`
  - `showWhen: ctx => !ctx.hasAccounts`
- [ ] **T042** [US4] En [frontend/src/components/onboarding/TourCard.tsx](frontend/src/components/onboarding/TourCard.tsx): renderizar el CTA cuando `step.cta && step.cta.showWhen?.(ctx)`. Acción `'create-account'` → llamar `accountStore.openCreateAccountModal()` y pausar el tour (no avanzar) hasta que el usuario decida continuar (botón "Siguiente" del propio tour sigue disponible).
- [ ] **T043** [US4] En [frontend/src/components/onboarding/TourProvider.tsx](frontend/src/components/onboarding/TourProvider.tsx): inyectar `ctx = { hasAccounts: useAccountStore(s => s.accounts.length > 0), hasTransactions: ... }` al render del paso.
- [ ] **T044** [P] [US4] Test Vitest: cuando `accounts=[]` y paso es `accounts-intro`, el CTA está visible. Cuando `accounts.length>0`, está oculto y aparece el mensaje informativo. Archivo: `frontend/src/components/onboarding/TourCard.test.tsx`.
- [ ] **T045** [P] [US4] Test Vitest: avanzar con "Siguiente" desde el paso N-1 al N navega al `route` del paso N si difiere de la actual (mock de `useNavigate`).
- [ ] **T046** [P] [US4] Test Vitest: si el `data-tour` del paso no existe en DOM tras 30 frames, la tarjeta cae a `placement='center'` sin romper.

**Checkpoint**: ejecutar quickstart §A1 paso a paso de 1 a 12 y validar el caso del CTA.

---

## Phase 7: User Story 5 — Accesibilidad y experiencia consistente (P2)

**Goal**: navegación completa por teclado, ARIA correcto, dark/light, responsive y `prefers-reduced-motion`.

**Independent Test**: completar tour solo con teclado (Tab/Shift+Tab/Enter/Esc), en dark y light, en móvil/tablet/desktop, con un lector de pantalla activo.

- [ ] **T047** [US5] En [frontend/src/components/onboarding/TourCard.tsx](frontend/src/components/onboarding/TourCard.tsx): asegurar `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (id del título), `aria-describedby` (id de la descripción). Mover foco automáticamente al botón primario al abrir.
- [ ] **T048** [US5] Atajos extra: `Enter` activa botón con foco (default), `→` siguiente y `←` anterior cuando el foco no está en input.
- [ ] **T049** [US5] Estilos responsive: la tarjeta usa `max-w-sm md:max-w-md` y `mx-4`; en `placement='center'` se centra en viewport sin overflow.
- [ ] **T050** [US5] Aplicar `useReducedMotion()` (Motion 12): si está activo, `transition={{ duration: 0 }}` y borde estático en `TourSpotlight`.
- [ ] **T051** [US5] Verificar contraste WCAG AA en dark/light usando los tokens Tailwind ya en uso (no inventar colores nuevos).
- [ ] **T052** [P] [US5] Test Vitest: roles ARIA presentes, foco inicial en botón primario, foco no escapa de la tarjeta. Archivo: `TourCard.test.tsx` (extender).
- [ ] **T053** [P] [US5] Test Vitest: con `matchMedia('(prefers-reduced-motion: reduce)')` mock = true, las animaciones se reducen.

**Checkpoint**: ejecutar quickstart §A5 y §A6.

---

## Phase 7.5: Robustez y edge cases (remediaciones del análisis)

- [ ] **T060** [US4] FR-021 — En [frontend/src/utils/tourSteps.ts](frontend/src/utils/tourSteps.ts) declarar el CTA dinámico del paso `closing` con resolución por contexto (`hasAccounts`/`hasTransactions`). En [frontend/src/components/onboarding/TourCard.tsx](frontend/src/components/onboarding/TourCard.tsx) renderizarlo. Acción `'goto-route'` con payload `/accounts` o `/transactions` que cierra tour como `COMPLETED` y navega.
- [ ] **T061** [US3] FR-027 — En [frontend/src/pages/SettingsPage.tsx](frontend/src/pages/SettingsPage.tsx) mostrar el estado actual del tour (`Completado` / `Saltado` / `No iniciado`) leyendo del `onboardingStore`.
- [ ] **T062** [US4] FR-022 — En [frontend/src/components/onboarding/TourProvider.tsx](frontend/src/components/onboarding/TourProvider.tsx): cuando se dispara la acción `create-account`, marcar flag `pausedForModal=true` en el store, ocultar `TourCard`+`TourSpotlight`. Suscribirse al cierre del modal (vía `accountStore`) para re-mostrar.
- [ ] **T063** [US1] FR-023 — En [frontend/src/components/onboarding/TourProvider.tsx](frontend/src/components/onboarding/TourProvider.tsx): si `location.pathname !== currentStep.route` y el cambio NO fue iniciado por el tour (flag interno `isInternalNav`), pausar render hasta volver a la ruta del paso.
- [ ] **T064** [US1] FR-024 — En [frontend/src/store/onboardingStore.ts](frontend/src/store/onboardingStore.ts): en `close()`, envolver `updateTourState` en retry simple (1 reintento a 2 s) antes de aceptar fallo.
- [ ] **T065** [US5] FR-025 — En [frontend/src/components/onboarding/TourProvider.tsx](frontend/src/components/onboarding/TourProvider.tsx): si el ancla está dentro del sidebar y el viewport es móvil con sidebar colapsado (`uiStore.sidebarOpen===false`), abrirlo antes del polling.
- [ ] **T066** [US4] FR-026 — `console.warn('[onboarding-tour] Anchor not found:', step.id)` cuando agota el polling.
- [ ] **T067** Documentar en spec/data-model que FR-019 ("omitir secciones inaccesibles") es out-of-scope en v1 (no hay permisos por sección hoy). Si en el futuro se introducen, añadir predicado `isAccessible(step, user)` antes del filtrado.

**Checkpoint**: re-ejecutar quickstart §A1–A6 con foco en edge cases nuevos.

---

## Phase 8: Polish & cross-cutting

- [ ] **T054** [P] Añadir entrada en Swagger para `/api/onboarding/tour` (validar que el JSDoc en `onboarding.routes.ts` (T010) genera doc correctamente en `/api/docs`).
- [ ] **T055** [P] Constitution V (ZERO-VULN): re-ejecutar `npm audit --omit=dev` en backend y frontend; reportar `0 vulnerabilities` o resolver.
- [ ] **T056** [P] Lint y typecheck:
  ```bash
  cd backend && npm run lint && npx tsc --noEmit
  cd frontend && npm run lint && npx tsc --noEmit
  ```
- [ ] **T057** Recorrer `quickstart.md` completo (A1–A6, B1–B2, C, D) y registrar en el PR las capturas/comentarios necesarios.
- [ ] **T058** Actualizar `CLAUDE.md` SOLO si la implementación introduce algún patrón nuevo reusable (no obligatorio).
- [ ] **T059** Marcar la feature como `implemented` en `.specify/feature.json`.

---

## Dependencies & Execution Order

- **Setup (T001–T003)**: pre-requisito de todo.
- **Foundational (T004–T006)**: bloqueante para Phases 3–7.
- **Phase 3 (US1, T007–T032)**: foundation real del tour. T007–T011 son secuenciales (controller depende de service depende de schema). T012 puede correr en paralelo a T013–T022 una vez existan service/controller. T023–T032 son paralelas entre sí pero requieren T014 (catálogo) lista.
- **Phase 4 (US2, T033–T036)**: depende de Phase 3 (necesita el motor del tour montado).
- **Phase 5 (US3, T037–T039)**: depende del store (T015) y del API (T013). Puede correr en paralelo a Phase 4.
- **Phase 6 (US4, T040–T046)**: depende del motor (T019) y del catálogo (T014).
- **Phase 7 (US5, T047–T053)**: pulido sobre componentes existentes; ejecutar tras Phases 3, 4 y 6.
- **Phase 8 (T054–T059)**: depende de todas las anteriores.

## Parallel Opportunities

- En Phase 3: T012 (test backend) || T013, T014, T017 (frontend independientes); T023–T032 (anclas en páginas) son todas paralelas.
- Tests de cada fase ([P]) son paralelos entre sí siempre que estén en archivos distintos.
- Phase 4 y Phase 5 pueden ejecutarse en paralelo entre sí.

## MVP Scope (mínimo entregable funcional)

Phases 1, 2, 3, 4 y la mitad de 6 (sin CTA condicional avanzado). Esto cumple US1 + US2 + recorrido completo y permite cerrar la feature básica. US3, US5 y polish complementan en iteración inmediata.

## Total

- **Setup**: 3 tareas
- **Foundational**: 3 tareas
- **US1**: 26 tareas
- **US2**: 4 tareas
- **US3**: 3 tareas
- **US4**: 7 tareas
- **US5**: 7 tareas
- **Polish**: 6 tareas
- **Total**: 59 tareas
