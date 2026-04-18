# Feature Specification: Unplanned Expenses Fix

**Feature Branch**: `007-unplanned-expenses-fix`  
**Created**: 2026-04-17  
**Status**: Draft  
**Input**: User description: "Fix unplanned expenses calculation so it reflects actual excess spending over budget, not just expenses in unbudgeted categories"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Excess spending in budgeted category counts as unplanned (Priority: P1)

As a user, when I spend more than my budgeted amount in a category, I want the excess amount to appear as "Gastos no planeados" so I can see how much I overspent beyond what I planned.

**Why this priority**: This is the core bug the user reported. The current behavior silently absorbs overspending into "planned" totals, hiding the real financial picture.

**Independent Test**: Create a budget of $100,000 for category "Alimentacion". Register $150,000 in expenses for that category. Verify "Gastos no planeados" shows $50,000.

**Acceptance Scenarios**:

1. **Given** a budget of $200,000 for "Transporte" in April 2026, **When** I register $350,000 in expenses for "Transporte", **Then** "Gastos no planeados" includes $150,000 (the excess over budget)
2. **Given** a budget of $200,000 for "Transporte" and actual spending of $150,000, **When** I view the monthly projection, **Then** "Gastos no planeados" does NOT include any amount from "Transporte" (spending is within budget)

---

### User Story 2 - Expenses in unbudgeted categories are fully unplanned (Priority: P1)

As a user, when I spend money in a category that has no budget at all, I want the full amount to count as "Gastos no planeados" since I never planned for those expenses.

**Why this priority**: This is existing behavior that must be preserved. Categories without any budget should still be fully unplanned.

**Independent Test**: Ensure category "Otros" has no budget for the month. Register a $90,000 expense in "Otros". Verify "Gastos no planeados" increases by $90,000.

**Acceptance Scenarios**:

1. **Given** no budget exists for category "Otros" in April 2026, **When** I register a $90,000 expense in "Otros", **Then** "Gastos no planeados" includes $90,000
2. **Given** no budgets exist at all for the month, **When** I register any expense, **Then** "Gastos no planeados" equals total actual expenses

---

### User Story 3 - Spending within budget is planned (Priority: P1)

As a user, when my spending in a budgeted category is at or below the budget amount, I want those expenses to be considered "planned" and NOT appear in "Gastos no planeados".

**Why this priority**: Ensures the metric is accurate in both directions — overspending is unplanned, but within-budget spending stays planned.

**Independent Test**: Create a budget of $500,000 for "Alimentacion". Register $400,000 in expenses. Verify "Gastos no planeados" does not include any amount from this category.

**Acceptance Scenarios**:

1. **Given** a budget of $500,000 for "Alimentacion", **When** actual spending is exactly $500,000, **Then** "Gastos no planeados" includes $0 from "Alimentacion"
2. **Given** a budget of $500,000 for "Alimentacion", **When** actual spending is $300,000, **Then** "Gastos no planeados" includes $0 from "Alimentacion"

---

### Edge Cases

- What happens when a budget has no category (categoryId is null)? Behavior should remain unchanged — only category-linked budgets define "planned" categories.
- What happens with expenses that have no category (categoryId is null)? They should count as unplanned since no budget can cover them.
- What happens with off-budget accounts? Existing filter must be preserved — off-budget account transactions are excluded from all calculations.
- What happens with TRANSFER type transactions? They must remain excluded from unplanned expenses (only EXPENSE type counts).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate unplanned expenses as the sum of: (a) for each budgeted expense category, max(0, actual_spending - budgeted_amount), plus (b) all expenses in categories with no budget
- **FR-002**: System MUST NOT count expenses within budget limits as unplanned
- **FR-003**: System MUST continue excluding TRANSFER type transactions from unplanned calculations
- **FR-004**: System MUST continue excluding transactions from off-budget accounts
- **FR-005**: System MUST treat expenses with null categoryId as unplanned
- **FR-006**: The change MUST be backend-only — the frontend already displays the `unplannedExpenses` value correctly

### Key Entities

- **Budget**: Defines planned spending per category per month. Key attributes: type (INCOME/EXPENSE), categoryId, amount, month, year
- **Transaction**: Actual financial movement. Key attributes: type (INCOME/EXPENSE/TRANSFER), categoryId, amount, date, accountId
- **Unplanned Expense**: Derived metric — the portion of actual expenses that exceeds what was budgeted, aggregated across all categories

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a user overspends in a budgeted category, "Gastos no planeados" reflects the excess amount within the same page load
- **SC-002**: When a user spends within budget in all categories, "Gastos no planeados" equals zero (assuming no unbudgeted-category expenses)
- **SC-003**: Existing behavior for categories without budgets is preserved — all such expenses remain fully unplanned
- **SC-004**: All existing backend tests continue to pass after the change

## Assumptions

- Target users are individual users managing personal finances who set monthly budgets per category
- The scope is limited to the `getMonthSummary` backend calculation — no schema changes, no new endpoints, no frontend changes
- Off-budget account filtering logic remains unchanged
- The "Gastos no planeados" metric is purely informational and does not trigger alerts or other side effects
