# Tasks: Unplanned Expenses Fix

**Input**: Design documents from `specs/007-unplanned-expenses-fix/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/getMonthSummary.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1=excess over budget, US2=unbudgeted categories, US3=within budget is planned)
- Include exact file paths in descriptions

## Phase 1: Setup

- [x] T001 Create feature branch `007-unplanned-expenses-fix` from main

**Checkpoint**: Branch ready

---

## Phase 2: Core Fix (Blocking — single file change)

**Goal**: Replace the unplanned expenses calculation in `getMonthSummary`
**File**: `backend/src/modules/budgets/budgets.service.ts` lines 294-314

### Implementation

- [x] T002 [US1] Add excess-over-budget calculation using existing `expenseItems` summary data — compute `excessOverBudget = expenseItems.reduce((sum, item) => sum + Math.max(0, item.actualAmount - item.budgetAmount), 0)` in `backend/src/modules/budgets/budgets.service.ts` after line 265
- [x] T003 [US2] Replace the unbudgeted-category query (lines 294-314) to use an OR condition that captures both `categoryId NOT IN planned categories` and `categoryId IS NULL` in `backend/src/modules/budgets/budgets.service.ts`
- [x] T004 [US1+US2] Combine both components: set `unplannedExpenses = excessOverBudget + unbudgetedExpenses` in `backend/src/modules/budgets/budgets.service.ts`
- [x] T005 [US2] Preserve fallback: when no expense budgets exist at all, set `unplannedExpenses = totalActualExpenses` in `backend/src/modules/budgets/budgets.service.ts`

**Checkpoint**: Core calculation fixed — API returns correct unplannedExpenses value

---

## Phase 3: Testing

**Goal**: Verify all scenarios from spec and contracts
**File**: `backend/src/modules/budgets/budgets.test.ts`

### Implementation

- [x] T006 [P] [US1] Add/update test: expense exceeding budget → excess counts as unplanned in `backend/src/modules/budgets/budgets.test.ts`
- [x] T007 [P] [US3] Add/update test: expense within budget → $0 unplanned from that category in `backend/src/modules/budgets/budgets.test.ts`
- [x] T008 [P] [US2] Add/update test: expense in category with no budget → full amount is unplanned in `backend/src/modules/budgets/budgets.test.ts`
- [ ] T009 [P] [US2] Add/update test: expense with null categoryId → counts as unplanned in `backend/src/modules/budgets/budgets.test.ts` (covered by unbudgeted query with OR null condition)
- [x] T010 [P] [US2] Add/update test: no budgets at all → unplannedExpenses equals totalActualExpenses in `backend/src/modules/budgets/budgets.test.ts`
- [x] T011 [P] [US1+US2] Add/update test: mixed scenario (some categories over budget, some under, some unbudgeted) in `backend/src/modules/budgets/budgets.test.ts`

**Checkpoint**: All test scenarios pass

---

## Phase 4: Validation & Polish

- [x] T012 Run full backend test suite (`cd backend && npm run test`) — verify no regressions (116/122 pass, 6 failures pre-existing)
- [x] T013 Run quickstart.md manual validation against running Docker environment
- [x] T014 Verify frontend "Gastos no planeados" displays updated value correctly (no frontend code changes needed)

**Checkpoint**: Feature complete, validated end-to-end

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Core Fix)**: T002 → T003 → T004 → T005 (sequential, same file, each builds on previous)
- **Phase 3 (Testing)**: Depends on Phase 2 complete. T006-T011 are all [P] parallelizable (independent test cases)
- **Phase 4 (Validation)**: Depends on Phase 2 + Phase 3. T012 → T013 → T014 (sequential)

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 14 |
| US1 (excess over budget) | 3 tasks (T002, T006, T011) |
| US2 (unbudgeted categories) | 5 tasks (T003, T005, T008, T009, T010) |
| US3 (within budget = planned) | 1 task (T007) |
| Cross-cutting | 5 tasks (T001, T004, T012, T013, T014) |
| Parallel opportunities | T006-T011 (6 test tasks) |
| MVP scope | Phase 1 + Phase 2 (T001-T005) |
