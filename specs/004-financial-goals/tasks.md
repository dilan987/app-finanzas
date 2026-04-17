# Tasks: Financial Goals (Metas de Pago)

**Input**: Design documents from `specs/004-financial-goals/`
**Prerequisites**: plan.md (required), spec.md (required)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Data Model & Schema)

- [ ] T001 Add GoalType, GoalStatus enums and Goal model to `backend/prisma/schema.prisma`. Add `goalId` optional field + relation to Transaction model and RecurringTransaction model. Add Goal[] relation to User model.
- [ ] T002 Run Prisma migration: `npx prisma migrate dev --name add-goals-model`
- [ ] T003 [P] Add Goal, GoalType, GoalStatus, GoalSummary, GoalDetail, GoalForMonth types and update Transaction/RecurringTransaction types with optional goalId in `frontend/src/types/index.ts`
- [ ] T004 [P] Add GOAL_TYPES and GOAL_STATUSES constants to `frontend/src/utils/constants.ts`

**Checkpoint**: Data model ready, types defined — module implementation can begin

---

## Phase 2: Backend Goals Module (US1 - Create a Financial Goal)

**Goal**: Full CRUD backend for goals with progress calculation
**Independent Test**: POST /api/goals creates goal, GET /api/goals returns it with correct suggestedInstallment and projectedEnd

### Implementation

- [ ] T005 [US1] Create Zod validation schemas in `backend/src/modules/goals/goals.schema.ts`: createGoalSchema (name, description?, type, targetAmount, plannedInstallments, startMonth, startYear), updateGoalSchema (name?, description?, plannedInstallments?), getGoalsQuerySchema (status?, type?, page?, limit?)
- [ ] T006 [US1] Create goals service in `backend/src/modules/goals/goals.service.ts`: implement getAll (with filters + pagination), getById (with linked transactions + derived progress), create (calculate suggestedInstallment and projectedEnd), update (recalculate on installment change), cancel (set status CANCELLED), getActiveForMonth (query by startMonth/Year <= month <= projectedEndMonth/Year and status ACTIVE)
- [ ] T007 [US1] Create goals controller in `backend/src/modules/goals/goals.controller.ts`: getAll, getById, create, update, cancel, getActiveForMonth, linkTransaction, unlinkTransaction
- [ ] T008 [US1] Create goals routes in `backend/src/modules/goals/goals.routes.ts`: GET /, GET /active-for-month, GET /:id, POST /, PUT /:id, PATCH /:id/cancel, POST /:id/link, DELETE /:id/unlink/:transactionId. All protected with authMiddleware + validate middleware.
- [ ] T009 [US1] Register goals routes in `backend/src/app.ts`: import and mount goalsRouter at `/api/goals`

**Checkpoint**: Goals CRUD API functional — can create, list, view, update, cancel goals

---

## Phase 3: Transaction-Goal Linking Backend (US2 - Link Transactions)

**Goal**: Transactions can be linked/unlinked to goals, progress derives from sum of linked tx
**Independent Test**: Create goal, create transaction with goalId, GET goal shows correct progress percentage

### Implementation

- [ ] T010 [US2] Add linkTransaction and unlinkTransaction methods to goals service in `backend/src/modules/goals/goals.service.ts`: validate goal ownership, validate goal is ACTIVE, validate transaction type matches goal type (EXPENSE→DEBT, INCOME→SAVINGS), validate transaction not already linked to another goal. After linking, check if goal should auto-complete (sum >= target).
- [ ] T011 [US2] Modify transactions service in `backend/src/modules/transactions/transactions.service.ts`: accept optional goalId on create/update, validate goal exists + is active + type matches. On update, if goalId changes, handle old/new links. Add auto-complete check after linking.
- [ ] T012 [US2] Update transaction Zod schemas in `backend/src/modules/transactions/transactions.schema.ts`: add optional goalId to createTransactionSchema and updateTransactionSchema

**Checkpoint**: Transactions can be linked to goals, progress calculates correctly

---

## Phase 4: Budget Projection Integration Backend (US3 - Goals in Projection)

**Goal**: Budget summary includes active goals with per-month actual payments and overall progress
**Independent Test**: Create goal + linked tx, GET /api/budgets/summary returns activeGoals array with correct installment, paidThisMonth, and progress

### Implementation

- [ ] T013 [US3] Modify budgets service in `backend/src/modules/budgets/budgets.service.ts`: in getMonthSummary, query active goals for the viewed month (using getActiveForMonth logic), for each goal calculate paidThisMonth (sum of linked tx in that month) and totalPaid (sum of all linked tx) and progress percentage. Add `activeGoals` array and `totalGoalsCommitment` to the projection response.

**Checkpoint**: Projection API returns goals data alongside budget items

---

## Phase 5: Recurring Transaction Integration Backend (US2 + FR-016)

**Goal**: Recurring templates support goalId, generated transactions inherit the link
**Independent Test**: Create recurring with goalId, process recurring, verify generated transaction has goalId

### Implementation

- [ ] T014 [US2] Modify recurring service in `backend/src/modules/recurring/recurring.service.ts`: in processRecurring, pass goalId from recurring template to created transaction. Before linking, check if goal is still ACTIVE — if not, create transaction without goalId. After creation, check auto-complete.
- [ ] T015 [P] [US2] Update recurring Zod schemas in `backend/src/modules/recurring/recurring.schema.ts`: add optional goalId to create and update schemas
- [ ] T016 [P] [US2] Update recurring controller/routes if needed to accept goalId in `backend/src/modules/recurring/recurring.controller.ts` and `backend/src/modules/recurring/recurring.routes.ts`

**Checkpoint**: Full backend complete — all API endpoints functional

---

## Phase 6: Frontend API & Types (US1)

**Goal**: Frontend API layer and navigation ready for goals feature
**Independent Test**: API module exports all methods, route renders empty GoalsPage

### Implementation

- [ ] T017 [P] [US1] Create goals API module in `frontend/src/api/goals.api.ts`: getAll, getById, create, update, cancel, getActiveForMonth, linkTransaction, unlinkTransaction
- [ ] T018 [P] [US1] Add /goals route with lazy-loaded GoalsPage in `frontend/src/routes/AppRoutes.tsx`
- [ ] T019 [P] [US1] Add "Metas" nav item to sidebar in `frontend/src/components/layout/Sidebar.tsx` (after Presupuestos, use HiFlag icon)
- [ ] T020 [P] [US1] Add "Metas" to mobile bottom tab bar more menu in `frontend/src/components/layout/BottomTabBar.tsx`

**Checkpoint**: Navigation wired, API layer ready

---

## Phase 7: Goals Page - List & Create (US1 + US5)

**Goal**: Dedicated goals page with summary cards, status filter tabs, goal cards with progress, and create modal
**Independent Test**: Visit /goals, create a goal, see it appear with progress bar and correct calculations

### Implementation

- [ ] T021 [US1][US5] Build GoalsPage in `frontend/src/pages/GoalsPage.tsx`: responsive layout with header (title + "Nueva meta" button), 4 StatCards (total committed, total paid, overall progress %, active count), filter tabs (Activas/Completadas/Canceladas), goal cards grid (2 cols desktop, 1 col mobile). Each goal card shows: name, type badge (Deuda/Ahorro), paid/target amounts, progress bar, suggested installment, month progress (e.g. "3/5 meses"). Create/edit modal with form: name, description (optional), type toggle (Deuda/Ahorro), target amount (CurrencyInput), planned installments (number), start month/year (month picker). Empty state when no goals exist.

**Checkpoint**: Users can create goals and see them listed with progress

---

## Phase 8: Goal Detail View (US5 + US2)

**Goal**: Goal detail modal showing full info, linked transactions, monthly breakdown, and ability to link existing transactions
**Independent Test**: Click a goal, see detail with linked tx list and monthly breakdown. Link an existing transaction from detail view.

### Implementation

- [ ] T022 [US5] Build goal detail modal in `frontend/src/pages/GoalsPage.tsx` (or separate component): large modal showing goal name, type badge, target amount, large progress bar with percentage, suggested installment, date range (start → projected end), linked transactions list (date, description, amount), monthly breakdown grid showing paid vs suggested per month.
- [ ] T023 [US2] Add "Vincular transaccion existente" flow in goal detail: button opens a searchable list of unlinked transactions (filtered by matching type: EXPENSE for DEBT, INCOME for SAVINGS), user selects one, calls POST /api/goals/:id/link, progress updates. Also allow unlinking with a remove button on each linked transaction.

**Checkpoint**: Full goal detail view with bidirectional transaction linking

---

## Phase 9: Transaction Form Integration (US2)

**Goal**: Transaction form shows optional goal dropdown when type is EXPENSE or INCOME
**Independent Test**: Create expense transaction, see debt goals in dropdown, select one, submit, goal progress updates

### Implementation

- [ ] T024 [US2] Modify `frontend/src/components/forms/TransactionForm.tsx`: add optional "Vincular a meta" Select field. Load active goals via goalsApi.getAll({status:'ACTIVE'}). Filter by type: show DEBT goals for EXPENSE tx, SAVINGS goals for INCOME tx. Hidden for TRANSFER. Include goalId in submit payload. When editing, pre-select current goalId.

**Checkpoint**: Transaction creation supports goal linking

---

## Phase 10: Budget Projection Integration Frontend (US3)

**Goal**: BudgetsPage shows active goals section in the projection view
**Independent Test**: Create goal + linked tx, visit budgets page, see goals section with suggested installment, actual paid this month, and overall progress

### Implementation

- [ ] T025 [US3] Modify `frontend/src/pages/BudgetsPage.tsx`: after existing budget items section, add "Metas activas este mes" section. Fetch goals data from projection summary response. For each active goal: show name, type badge, suggested installment, actual paid this month (with checkmark if met or exceeded, arrow up if exceeded), overall progress bar. Show totals row: total commitment and total paid. If no active goals, don't show the section. Recently completed goals show celebratory badge.

**Checkpoint**: Budget projection view includes goals — core P1 stories complete

---

## Phase 11: Recurring Page Integration (FR-016)

**Goal**: Recurring transaction form includes optional goal dropdown
**Independent Test**: Create recurring transaction linked to a goal, verify goalId is saved

### Implementation

- [ ] T026 [US2] Modify `frontend/src/pages/RecurringPage.tsx`: add optional "Vincular a meta" Select field in the create/edit form. Same pattern as TransactionForm: load active goals, filter by type match, include goalId in payload.

**Checkpoint**: Recurring templates support goal linking

---

## Phase 12: Polish & Cross-Cutting (US4 + Quality)

- [ ] T027 [US4] Implement goal edit flow in GoalsPage: edit modal pre-fills name, description, plannedInstallments (target amount shown but NOT editable). On save, recalculate suggested installment and projected end.
- [ ] T028 [US4] Implement goal cancel flow in GoalsPage: confirm dialog, calls PATCH /api/goals/:id/cancel, removes from active list, shows in Canceladas tab.
- [ ] T029 [US4] Implement auto-complete detection: in the frontend, after any transaction create/edit that involves a goalId, check if the returned goal progress >= 100%. If so, show celebratory toast ("Meta '{name}' completada!") and update goal status badge to completed.
- [ ] T030 [P] Write backend tests in `backend/src/modules/goals/goals.test.ts`: test goal CRUD, progress calculation, auto-complete, type validation (EXPENSE only links to DEBT, etc.), cancel preserves transactions, projection includes goals.
- [ ] T031 Verify responsive design on all screen sizes (mobile 375px, tablet 768px, desktop 1024px+) and dark/light mode for: GoalsPage, goal detail modal, goal cards, budget projection goals section, transaction form goal dropdown, recurring form goal dropdown.
- [ ] T032 [P] Add Swagger/OpenAPI annotations to goals routes in `backend/src/modules/goals/goals.routes.ts`
- [ ] T033 [P] Add linkTransactionSchema and activeForMonthQuerySchema to `backend/src/modules/goals/goals.schema.ts`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — T003, T004 parallelizable with each other
- **Phase 2 (Backend CRUD)**: Depends on Phase 1 (T001, T002 must complete first)
- **Phase 3 (Tx Linking)**: Depends on Phase 2
- **Phase 4 (Projection Backend)**: Depends on Phase 3
- **Phase 5 (Recurring Backend)**: Depends on Phase 2, parallelizable with Phase 3-4
- **Phase 6 (Frontend Setup)**: Depends on Phase 1 (T003), parallelizable with Phase 2-5
- **Phase 7 (Goals Page)**: Depends on Phase 2 + Phase 6
- **Phase 8 (Goal Detail)**: Depends on Phase 7
- **Phase 9 (Tx Form)**: Depends on Phase 3 + Phase 6, parallelizable with Phase 7-8
- **Phase 10 (Projection UI)**: Depends on Phase 4 + Phase 7
- **Phase 11 (Recurring UI)**: Depends on Phase 5 + Phase 6, parallelizable with Phase 7-10
- **Phase 12 (Polish)**: Depends on all previous phases

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 31 |
| US1 (Create Goal) | 10 tasks (T001-T009, T017-T021) |
| US2 (Link Transactions) | 9 tasks (T010-T012, T014-T016, T023-T024, T026) |
| US3 (Projection) | 2 tasks (T013, T025) |
| US4 (Manage) | 3 tasks (T027-T029) |
| US5 (Goals Page) | 2 tasks (T021-T022, shared with US1/US2) |
| Cross-cutting | 5 tasks (T003, T004, T030, T031) |
| Parallelizable | 10 tasks marked [P] |
| MVP scope (P1) | T001-T025 (Phases 1-10) |
