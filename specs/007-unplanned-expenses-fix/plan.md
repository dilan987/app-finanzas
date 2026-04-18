# Implementation Plan: Unplanned Expenses Fix

**Branch**: `007-unplanned-expenses-fix` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-unplanned-expenses-fix/spec.md`

## Summary

Fix the "Gastos no planeados" calculation so that overspending in budgeted categories counts as unplanned (excess over budget), not just expenses in completely unbudgeted categories. Backend-only change to `getMonthSummary` in `budgets.service.ts`.

## Technical Context

**Language/Version**: TypeScript 6  
**Primary Dependencies**: Express.js 5, Prisma 6  
**Storage**: PostgreSQL 16  
**Testing**: Jest 30 + Supertest  
**Target Platform**: Web (Docker)  
**Project Type**: web-service (backend-only change)  
**Performance Goals**: No additional DB queries (reuse existing `summary` data)  
**Constraints**: No schema changes, no frontend changes, no new endpoints  
**Scale/Scope**: Single function modification (~20 lines changed)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | PASS | Change stays within `budgets` module service layer |
| II. Type Safety | PASS | No new types needed; existing types sufficient |
| III. Validation at Boundaries | PASS | No new inputs; existing Zod validation unchanged |
| IV. Security First | PASS | No auth changes; user scoping preserved |
| V. Test Coverage | PASS | Existing tests must be updated to verify new logic |

**Post-Design Re-check**: All gates still PASS. No new dependencies, no schema changes, no architecture deviations.

## Project Structure

### Documentation (this feature)

```text
specs/007-unplanned-expenses-fix/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── getMonthSummary.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (files modified)

```text
backend/
└── src/
    └── modules/
        └── budgets/
            ├── budgets.service.ts    # Lines 294-314: replace unplanned calculation
            └── budgets.test.ts       # Update/add tests for new logic
```

## Implementation Approach

### Step 1: Compute excess over budget from existing summary data

The `summary` array (already computed at lines 227-262) contains `budgetAmount` and `actualAmount` for each budget item. For expense items, calculate:

```typescript
const excessOverBudget = expenseItems.reduce(
  (sum, item) => sum + Math.max(0, item.actualAmount - item.budgetAmount), 0
);
```

### Step 2: Query expenses in fully unbudgeted categories

Keep a query for expenses in categories NOT in any budget AND expenses with null categoryId:

```typescript
// Categories that have a budget (even if overspent, the excess is already counted)
const plannedExpenseCategoryIds = budgets
  .filter(b => b.type === 'EXPENSE' && b.categoryId)
  .map(b => b.categoryId!);

// Expenses in categories with no budget + null category expenses
const unbudgetedResult = await prisma.transaction.aggregate({
  where: {
    userId,
    type: TransactionType.EXPENSE,
    date: { gte: startDate, lte: endDate },
    ...onBudgetFilter,
    OR: [
      ...(plannedExpenseCategoryIds.length > 0
        ? [{ categoryId: { notIn: plannedExpenseCategoryIds } }]
        : []),
      { categoryId: null },
    ],
  },
  _sum: { amount: true },
});
```

### Step 3: Combine both components

```typescript
unplannedExpenses = excessOverBudget + unbudgetedExpenses;
```

**Special case**: If no budgets exist at all (`plannedExpenseCategoryIds.length === 0` and no expense items), all expenses are unplanned — keep existing fallback: `unplannedExpenses = totalActualExpenses`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | — | — |
