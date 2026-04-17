# Tasks: Goals V2 — Differentiated DEBT vs SAVINGS Experience

**Input**: Design documents from `specs/005-goals-v2-enhancement/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/goals-api.md, contracts/projection-types.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- US1: SAVINGS goal with smart projections
- US2: DEBT form stays as-is
- US3: Savings goal detail with projection insights
- US4: Contribution frequency on savings goals

---

## Phase 1: Schema & Foundational (Blocking)

- [x] T001 [US1] Add `ContributionFrequency` enum and update `Goal` model — make `plannedInstallments`, `suggestedInstallment`, `startMonth`, `startYear`, `projectedEndMonth`, `projectedEndYear` nullable; add `contributionFrequency` and `plannedContribution` fields → `backend/prisma/schema.prisma`
- [x] T002 [US1] Run `prisma generate` inside Docker container to regenerate Prisma client with new schema types
- [x] T003 [US1] Run `prisma db push` inside Docker container to apply schema changes to database

**Checkpoint**: Database schema updated, Prisma types available

---

## Phase 2: Backend Validation & Service (Blocking)

- [x] T004 [US1] Refactor `createGoalSchema` to Zod discriminated union — DEBT variant requires `plannedInstallments`, `startMonth`, `startYear`; SAVINGS variant accepts optional `contributionFrequency`, `plannedContribution` → `backend/src/modules/goals/goals.schema.ts`
- [x] T005 [P] [US2] Refactor `updateGoalSchema` — DEBT allows updating `plannedInstallments`; SAVINGS allows updating `contributionFrequency`, `plannedContribution` → `backend/src/modules/goals/goals.schema.ts`
- [x] T006 [US1] Refactor `create` function in goals service — DEBT path keeps current logic (calculateSuggestedInstallment, calculateProjectedEnd); SAVINGS path stores contribution fields, skips installment calculations → `backend/src/modules/goals/goals.service.ts`
- [x] T007 [US2] Refactor `update` function — handle nullable installment fields for DEBT, contribution fields for SAVINGS → `backend/src/modules/goals/goals.service.ts`
- [x] T008 [US1] Refactor `getAll` and `getById` — serialize new nullable fields (`contributionFrequency`, `plannedContribution`), handle nullable `suggestedInstallment` → `backend/src/modules/goals/goals.service.ts`
- [x] T009 [US1] Refactor `getActiveForMonth` — SAVINGS goals (no start/end month) are always included as active; handle nullable `suggestedInstallment` in commitment calculation → `backend/src/modules/goals/goals.service.ts`

**Checkpoint**: Backend CRUD works for both DEBT and SAVINGS goal types

---

## Phase 3: Projection Engine (US1 — P1)

**Goal**: Compute historical, planned, and actual projections for SAVINGS goals
**Independent Test**: Create savings goal → GET projection → verify insight messages

### Implementation

- [x] T010 [US1] Implement `getHistoricalMonthlyRate(userId)` — query last 6 months of INCOME transactions, compute weighted average (recent 3 months × 2, older 3 months × 1) → `backend/src/modules/goals/goals.service.ts`
- [x] T011 [US1] Implement `getPlannedMonthlyRate(contributionFrequency, plannedContribution)` — convert frequency to monthly rate (WEEKLY×4, BIWEEKLY×2, MONTHLY×1) → `backend/src/modules/goals/goals.service.ts`
- [x] T012 [US1] Implement `getActualMonthlyRate(goalId, createdAt)` — totalPaid / months elapsed since goal creation → `backend/src/modules/goals/goals.service.ts`
- [x] T013 [US1] Implement `getProjection(goalId, userId)` — orchestrate all three rates, compute months remaining, generate Spanish insight messages, determine pace status → `backend/src/modules/goals/goals.service.ts`
- [x] T014 [US1] Add `getProjection` controller handler → `backend/src/modules/goals/goals.controller.ts`
- [x] T015 [US1] Register `GET /:id/projection` route (before `/:id` to avoid param conflict) → `backend/src/modules/goals/goals.routes.ts`

**Checkpoint**: Projection API returns computed data for SAVINGS goals

---

## Phase 4: Frontend Types & API (US1 — P1)

**Goal**: Update frontend types and API client for v2 schema
**Independent Test**: TypeScript compiles with no errors

### Implementation

- [x] T016 [P] [US1] Update `Goal` interface — make DEBT fields nullable, add `contributionFrequency`, `plannedContribution` → `frontend/src/types/index.ts`
- [x] T017 [P] [US1] Add `ContributionFrequency` type, `GoalProjection` interface → `frontend/src/types/index.ts`
- [x] T018 [P] [US1] Update `CreateGoalData` to discriminated union (`CreateDebtGoalData | CreateSavingsGoalData`) → `frontend/src/types/index.ts`
- [x] T019 [P] [US1] Update `UpdateGoalData` — add optional `contributionFrequency`, `plannedContribution` → `frontend/src/types/index.ts`
- [x] T020 [P] [US1] Update `GoalActiveForMonth` — make installment fields nullable, add contribution fields → `frontend/src/types/index.ts`
- [x] T021 [US1] Add `getProjection(goalId)` method to goals API client → `frontend/src/api/goals.api.ts`
- [x] T022 [P] [US4] Add `CONTRIBUTION_FREQUENCIES` constant (WEEKLY/Semanal, BIWEEKLY/Quincenal, MONTHLY/Mensual) → `frontend/src/utils/constants.ts`

**Checkpoint**: Frontend types and API ready for UI work

---

## Phase 5: Frontend Form Differentiation (US1 + US2 + US4 — P1)

**Goal**: Creation form adapts dynamically based on goal type selection
**Independent Test**: Select Ahorro → installment fields hidden, contribution fields visible. Select Deuda → reverse.

### Implementation

- [x] T023 [US1] Refactor GoalsPage form state — remove required installment fields from initial state; add `contributionFrequency`, `plannedContribution` optional fields → `frontend/src/pages/GoalsPage.tsx`
- [x] T024 [US1] Implement dynamic form rendering — when type=DEBT show installments/start date fields (existing); when type=SAVINGS show contribution frequency + amount fields → `frontend/src/pages/GoalsPage.tsx`
- [x] T025 [US2] Ensure DEBT form path unchanged — same fields, same validation, same installment preview calculation → `frontend/src/pages/GoalsPage.tsx`
- [x] T026 [US4] Add contribution frequency dropdown and planned contribution CurrencyInput to SAVINGS form section → `frontend/src/pages/GoalsPage.tsx`
- [x] T027 [US1] Update form submission — build discriminated `CreateGoalData` based on type, send correct payload → `frontend/src/pages/GoalsPage.tsx`
- [x] T028 [US1] Update edit modal population — handle nullable fields, populate contribution fields for SAVINGS and installment fields for DEBT → `frontend/src/pages/GoalsPage.tsx`

**Checkpoint**: Form creates both DEBT and SAVINGS goals correctly

---

## Phase 6: Frontend Projection Display (US1 + US3 — P1)

**Goal**: Show projection insights on goal cards and in detail modal
**Independent Test**: Create savings goal → card shows projection → detail shows full insight section

### Implementation

- [x] T029 [US1] Add projection fetch to goal card — after goals load, fetch projections for SAVINGS goals; display brief insight on card → `frontend/src/pages/GoalsPage.tsx`
- [x] T030 [US3] Add projection section to detail modal — fetch projection on open; display historical, planned, actual insights with formatted currency → `frontend/src/pages/GoalsPage.tsx`
- [x] T031 [US3] Implement pace comparison UI — ahead (green), behind (amber), on_track (blue), no_data (gray) with corresponding messages → `frontend/src/pages/GoalsPage.tsx`
- [x] T032 [US1] Implement fallback messages — no data, no income history, no planned contribution → `frontend/src/pages/GoalsPage.tsx`
- [x] T033 [US1] Adapt goal cards list view — DEBT shows "Cuota sugerida: $X", SAVINGS shows projected completion or contribution info → `frontend/src/pages/GoalsPage.tsx`

**Checkpoint**: SAVINGS goals display projection insights throughout the UI

---

## Phase 7: Cross-Cutting Adaptations

- [x] T034 [US2] Update BudgetsPage "Metas del Mes" — handle nullable `suggestedInstallment`, display contribution info for SAVINGS goals → `frontend/src/pages/BudgetsPage.tsx`
- [x] T035 [P] [US2] Update GoalActiveForMonth handling — SAVINGS goals always shown, adapt commitment calculation → `frontend/src/pages/BudgetsPage.tsx`
- [x] T036 [P] [US1] Update edit form in GoalsPage — SAVINGS edit shows contribution fields, DEBT edit shows installment fields → `frontend/src/pages/GoalsPage.tsx`

**Checkpoint**: All cross-cutting views adapted for both goal types

---

## Phase 8: Build, Deploy & Validate

- [x] T037 Build backend (`tsc --noEmit`) — verify zero TypeScript errors → `backend/`
- [x] T038 [P] Build frontend (`npm run build`) — verify zero compilation errors → `frontend/`
- [x] T039 Rebuild Docker containers (`docker-compose up --build -d`) and verify healthy
- [x] T040 Run quickstart validation scenarios (quickstart.md) — test all 10 scenarios

**Checkpoint**: Feature deployed and validated

---

## Dependencies & Execution Order

```
Phase 1 (Schema)
  └── Phase 2 (Backend CRUD) — BLOCKS all below
        ├── Phase 3 (Projection Engine)
        │     └── Phase 6 (Frontend Projection Display)
        └── Phase 4 (Frontend Types) — BLOCKS Phase 5, 6
              ├── Phase 5 (Frontend Form)
              └── Phase 6 (Frontend Projection Display)
Phase 7 (Cross-Cutting) — depends on Phase 5 + 6
Phase 8 (Build & Deploy) — depends on ALL above
```

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 40 |
| US1 (SAVINGS + Projections) | 24 |
| US2 (DEBT unchanged) | 7 |
| US3 (Detail insights) | 3 |
| US4 (Contribution frequency) | 3 |
| Parallelizable tasks | 10 |
| MVP scope (US1 + US2) | 31 tasks |
| Phases | 8 |
