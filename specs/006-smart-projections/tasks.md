# Tasks: 006-smart-projections

## Phase 1: Backend — Projection Engine Rewrite

- [X] T001 [US1] Rewrite `getHistoricalMonthlyRate` → `getNetMonthlySavings` in `backend/src/modules/goals/goals.service.ts`
  - Query INCOME + EXPENSE (exclude TRANSFER) over 6 months
  - Group by month, compute net per month
  - Apply weighted average (recent half × 2, older half × 1)
  - Return `{ netMonthlySavings, monthsOfData }` or null

- [X] T002 [US2] Add `getAvailableBalance(userId)` in `backend/src/modules/goals/goals.service.ts`
  - Aggregate currentBalance from accounts where isActive=true AND includeInTotal=true

- [X] T003 [US3] Add `getTotalGoalCommitments(userId, excludeGoalId)` in `backend/src/modules/goals/goals.service.ts`
  - Query all other active goals
  - Sum DEBT suggestedInstallment + SAVINGS plannedContribution × frequency multiplier

- [X] T004 [US1][US2][US3] Update `GoalProjection` interface and `getProjection` orchestrator in `backend/src/modules/goals/goals.service.ts`
  - Add new fields: netMonthlySavings, availableBalance, totalGoalCommitments, isOvercommitted, monthsOfData
  - Call new functions
  - Generate enhanced Spanish insight messages
  - Handle edge cases: negative savings, zero savings, limited data, balance covers goal, overcommitment

## Phase 2: Frontend — Type & Rendering Updates

- [X] T005 [P] Update `GoalProjection` interface in `frontend/src/types/index.ts`
  - Add: netMonthlySavings, availableBalance, totalGoalCommitments, isOvercommitted, monthsOfData

- [X] T006 Update projection rendering in `frontend/src/pages/GoalsPage.tsx`
  - Historical rate card: show netMonthlySavings value, label "Ahorro Neto"
  - Add balance insight card when availableBalance > 0
  - Add overcommitment warning when isOvercommitted = true
  - Ensure all insight messages render (already dynamic)

## Phase 3: Build & Verify

- [X] T007 TypeScript compilation check (backend + frontend)
- [X] T008 Docker rebuild and deployment verification
