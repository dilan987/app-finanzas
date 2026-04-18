# Research: 007-unplanned-expenses-fix

## Phase 0: Unknowns Resolution

### R-001: Current unplanned expenses calculation logic

**Decision**: Replace category-exclusion approach with per-category excess calculation.

**Current Implementation** (`budgets.service.ts:294-314`):
- Collects all categoryIds from EXPENSE budgets
- Runs a single aggregate query for expenses with `categoryId NOT IN planned_categories`
- Result: only expenses in completely unbudgeted categories count as "unplanned"

**Problem**: An expense of $90,000 in category "Otros" with a budget of $50,000 registers as $0 unplanned — the full $90,000 is treated as "planned" even though only $50,000 was budgeted.

**Rationale**: The new approach must sum two components:
1. **Excess over budget**: For each EXPENSE budget with a category, `max(0, actual - budgeted)`
2. **Fully unbudgeted**: Expenses in categories with no budget at all (preserves existing behavior for this case)

### R-002: Can we reuse existing data already computed?

**Decision**: Yes. The `summary` array (lines 227-262) already computes `actualAmount` and `budgetAmount` per budget item. We can derive excess directly from `expenseItems` without additional DB queries.

**Rationale**: Eliminates the need for the separate `unplannedResult` aggregate query for budgeted categories. Only one query remains — for expenses in unbudgeted categories.

### R-003: Handling null categoryId on expenses

**Decision**: Expenses with null categoryId are always unplanned.

**Rationale**: The current `notIn` query with Prisma already excludes null categoryId rows (SQL `NULL NOT IN (...)` evaluates to UNKNOWN). The new approach must explicitly handle this — add `categoryId: null` to the unbudgeted expenses query via OR condition, or use a separate query.

### R-004: Performance impact

**Decision**: No performance regression — the change reduces DB queries.

**Rationale**: Current code runs 1 extra aggregate query for unplanned expenses. New code reuses already-computed `summary` data for excess calculation and keeps at most 1 query for unbudgeted categories. Net effect: same or fewer queries.

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Add `isPlanned` boolean field to Transaction model | Schema change is overkill for a derived metric; increases write complexity |
| Track unplanned at write-time in a separate table | Adds synchronization burden; calculation from existing data is simple and correct |
| Frontend-side calculation from budget items | Violates single source of truth; backend should own business logic |
