# Feature Specification: Financial Goals (Metas de Pago)

**Feature Branch**: `004-financial-goals`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "A goal-tracking system where users can create financial goals tied to debts or savings targets. Goals have a target amount, number of installments, and a deadline. Transactions can be linked to goals to track progress. Active goals must be visible in the budget projection view."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Financial Goal (Priority: P1)

As a user, I want to create a financial goal (debt payoff or savings target) with a target amount and a planned number of installments, so I can organize my finances around clear objectives.

For example, I bought a laptop for $2,500,000 COP and plan to pay it off in roughly 5 months. I create a goal with the total amount and 5 planned installments. The system calculates a suggested monthly amount of $500,000 as a reference, but I'm free to pay more or less in any given month — what matters is total progress toward the target.

**Why this priority**: This is the core value proposition. Without goal creation, nothing else works.

**Independent Test**: Create a goal with a total amount and installment count. Verify the goal appears in the goals list with correct calculated suggested installment and projected end date.

**Acceptance Scenarios**:

1. **Given** I am on the goals page, **When** I fill in name ("Laptop"), goal type (debt), total amount ($2,500,000), planned installments (5), and start month (April 2026), **Then** the system creates the goal, calculates a suggested monthly installment ($500,000) as reference, and shows projected end date (August 2026).
2. **Given** I create a goal, **When** I view the goals list, **Then** I see the goal with its name, total amount, suggested installment, progress (0%), and status (active).
3. **Given** I create a savings goal "Vacation fund" for $3,000,000 in 6 months, **When** it is created, **Then** the system shows a suggested monthly contribution of $500,000.

---

### User Story 2 - Link Transactions to a Goal (Priority: P1)

As a user, when I register a transaction, I want to optionally link it to an active goal so that my progress is tracked automatically. I should be free to link any number of transactions in any month — the suggested installment is just a reference, not a limit.

For example, I make two payments of $300,000 and $400,000 toward my laptop debt in the same month. Both get linked to the "Laptop" goal. Progress jumps to 28% ($700,000 / $2,500,000). The system doesn't restrict me to one payment per month or to the exact suggested amount.

**Why this priority**: Without linking transactions to goals, the user can't track real progress. This is what makes goals actionable.

**Independent Test**: Create a goal, then create multiple transactions linked to that goal in the same month. Verify the goal's paid amount and progress percentage update correctly with the sum of all linked transactions.

**Acceptance Scenarios**:

1. **Given** I have an active debt goal "Laptop" ($2,500,000), **When** I create an expense transaction of $500,000 and link it to "Laptop", **Then** the goal shows $500,000 paid (20% progress).
2. **Given** I have a debt goal with $500,000 paid, **When** I create another linked expense of $700,000 in the same month, **Then** the goal shows $1,200,000 paid (48% progress) — no restriction on amount or frequency.
3. **Given** I have a savings goal "Vacation" ($3,000,000), **When** I link an income transaction of $800,000 (more than the $500,000 suggested), **Then** the goal shows $800,000 saved (26.7% progress) — exceeding the suggestion is perfectly fine.
4. **Given** I have a goal, **When** I edit or delete a linked transaction, **Then** the goal's progress recalculates automatically.

---

### User Story 3 - View Active Goals in Budget Projection (Priority: P1)

As a user, when I view my monthly budget projection, I want to see my active goals for that month — the suggested installment as a planning reference, what I've actually paid/saved this month toward each goal, and overall progress — so I can plan my monthly spending with full visibility.

**Why this priority**: The user explicitly requested that goals integrate with the projection view. This is essential for monthly financial planning.

**Independent Test**: Create a goal spanning multiple months. Navigate to the budget projection for a month within the goal's range. Verify the goal appears with the suggested installment, actual payments this month, and overall progress.

**Acceptance Scenarios**:

1. **Given** I have an active goal "Laptop" starting April 2026 with suggested installment of $500,000, **When** I view the budget projection for May 2026, **Then** I see "Laptop" with: suggested installment ($500,000), actual paid this month ($0 or sum of linked tx in May), and overall progress.
2. **Given** I paid $700,000 toward "Laptop" in May (more than the $500,000 suggestion), **When** I view May's projection, **Then** it shows I exceeded the planned installment by $200,000 and overall progress reflects the total paid.
3. **Given** I have multiple active goals, **When** I view the budget projection, **Then** all active goals for that month are listed with a total monthly commitment (sum of suggested installments) and total actual paid this month.
4. **Given** a goal is not active for the viewed month (before start or already completed), **When** I view that month's projection, **Then** the goal does not appear.

---

### User Story 4 - Manage Goals (Edit, Complete, Cancel) (Priority: P2)

As a user, I want to edit, manually complete, or cancel my goals to handle changes in my financial situation.

**Why this priority**: Important for a complete user experience but not required for the core value of tracking goal progress.

**Independent Test**: Edit a goal's name or installment count. Mark a goal as completed. Cancel a goal. Verify each action updates the goal correctly.

**Acceptance Scenarios**:

1. **Given** I have an active goal, **When** I edit the number of planned installments from 5 to 3, **Then** the suggested monthly amount recalculates (higher) and the projected end date shortens.
2. **Given** I have a goal where total linked transactions meet or exceed the target, **When** the system detects this, **Then** the goal is automatically marked as completed.
3. **Given** I have an active goal, **When** I choose to cancel it, **Then** the goal is marked as cancelled, linked transactions remain unchanged, and it no longer appears in projections.
4. **Given** I have a debt goal and I paid it off in 3 months instead of the planned 5, **When** I view the goal, **Then** it shows as completed early with correct total paid.

---

### User Story 5 - Goals Page Overview (Priority: P2)

As a user, I want a dedicated goals page where I can see all my goals (active, completed, cancelled) with visual progress indicators, so I have a clear picture of my financial commitments.

**Why this priority**: Enhances usability and provides a central hub, but the core tracking works through the projection view and transaction linking.

**Independent Test**: Create multiple goals in different states. Navigate to the goals page. Verify all goals are visible with correct progress bars, status badges, and summary statistics.

**Acceptance Scenarios**:

1. **Given** I have 3 active goals and 1 completed goal, **When** I visit the goals page, **Then** I see all 4 goals with visual progress bars, status indicators, and a summary showing total committed, total paid, and total remaining.
2. **Given** I am on the goals page, **When** I click on a goal, **Then** I see its detail view with: linked transactions list, monthly breakdown of payments, and visual progress timeline.

---

### Edge Cases

- What happens when a goal's start month is in the past? The system should allow it and show months with no payments as $0 paid.
- What happens when total linked transactions exceed the target amount? The goal shows >100% progress and auto-completes. The overpayment is visible.
- What happens when a user deletes all transactions linked to a goal? The goal resets to 0% progress but remains active.
- What happens when a user has no active goals? The projection view simply doesn't show the goals section.
- What happens when a goal spans into future months beyond the current view? Only the current viewed month is relevant — show the suggested installment for that month.
- What happens when a transaction is linked to a goal but the transaction type doesn't match? Only EXPENSE transactions can be linked to debt goals; only INCOME transactions can be linked to savings goals. The UI must enforce this.
- What happens when a user wants to pay multiple installments in one transaction? They just link a larger transaction — there's no per-installment enforcement, progress is based on total amount.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create financial goals with: name, description (optional), goal type (debt or savings), target amount, planned number of installments, and start month/year.
- **FR-002**: System MUST calculate a suggested monthly installment (target / planned installments) as a planning reference, not as a constraint.
- **FR-003**: System MUST determine a projected end date based on start month and planned installment count.
- **FR-004**: Users MUST be able to link a transaction to an active goal in two ways: (a) from the transaction form (dropdown when creating or editing a transaction), and (b) from the goal detail view (search and select existing unlinked transactions to associate). There is no limit on how many transactions can be linked per month or on their amounts.
- **FR-005**: System MUST calculate goal progress as: (sum of all linked transaction amounts / target amount) * 100.
- **FR-006**: System MUST recalculate goal progress whenever a linked transaction is created, edited, or deleted.
- **FR-007**: System MUST display active goals in the budget projection view, showing: suggested installment for the month, actual amount paid/saved this month (sum of linked tx in that month), and overall progress percentage.
- **FR-008**: System MUST display a total monthly commitment (sum of all active goals' suggested installments) in the projection view.
- **FR-009**: Users MUST be able to view a dedicated goals page with all goals filtered by status (active, completed, cancelled).
- **FR-010**: Users MUST be able to edit a goal's name, description, and planned installment count (which recalculates the suggested monthly amount). The target amount is NOT editable — goals are fixed commitments. If the situation changes, the user cancels the meta and creates a new one.
- **FR-011**: System MUST automatically mark a goal as completed when total linked transaction amounts meet or exceed the target amount. Upon completion, the system MUST show a celebratory toast notification (e.g., "Meta 'Laptop' completada!") and display a visual badge on the goals page and projection view indicating recently completed status.
- **FR-012**: Users MUST be able to manually cancel a goal without affecting linked transactions.
- **FR-013**: Users MUST be able to view a goal's detail: linked transactions, per-month payment breakdown, and visual progress.
- **FR-014**: System MUST scope all goals to the authenticated user.
- **FR-015**: Goal type determines which transaction types can be linked: debt goals accept EXPENSE transactions, savings goals accept INCOME transactions.
- **FR-016**: Recurring transaction templates MUST support an optional goal association. When a recurring transaction generates a new transaction, it MUST automatically inherit the goal link. If the linked goal is no longer active (completed/cancelled), the generated transaction is created without a goal link.

### Key Entities *(include if feature involves data)*

- **Goal**: Represents a financial target. Has a name, optional description, type (debt or savings), target amount, planned number of installments, calculated suggested installment amount, start month/year, projected end month/year, status (active, completed, cancelled), and the owning user.
- **Goal-Transaction Link**: The association between a transaction and a goal. A transaction can be linked to at most one goal. A goal can have many linked transactions. Progress is derived from the sum of linked transaction amounts — it is not stored as a fixed value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a goal and see it reflected in the goals page within the same session.
- **SC-002**: Linking a transaction to a goal updates the goal's progress percentage in real time (no page refresh needed).
- **SC-003**: The budget projection view accurately shows all active goals for the selected month with suggested installment, actual paid this month, and overall progress.
- **SC-004**: Goal progress is always consistent with the sum of linked transactions (derived, never stale).
- **SC-005**: Users can link multiple transactions of any amount to a goal in the same month without restrictions.
- **SC-006**: All goal operations work correctly in both light and dark mode.
- **SC-007**: Goal data is properly scoped — users can only access their own goals.

## Assumptions

- Users primarily use goals for debt repayment (installment purchases, loans) but may also use them for savings targets.
- The existing transaction system will be extended (not replaced) to support optional goal linking.
- The suggested installment amount is a planning aid, not an enforced constraint — users have full flexibility in how much and how often they contribute toward a goal.
- The projection/budget view already exists and will be enhanced to show goals alongside budget items.
- Currency for goals follows the transaction's currency (COP by default).
- A transaction can only be linked to one goal at a time (simplicity over flexibility in v1).
- Goals are account-agnostic — any transaction of the matching type (expense/income) can be linked regardless of which account it belongs to.

## Clarifications

### Session 2026-04-15

| # | Question | Decision | Impact |
|---|----------|----------|--------|
| 1 | Can the target amount be edited? | **No. Goals are fixed commitments.** If the situation changes, cancel and create a new one. | FR-010: target amount excluded from editable fields |
| 2 | Where can users link transactions to goals? | **Both**: (a) dropdown in transaction form, and (b) from goal detail view selecting existing unlinked transactions. | FR-004: two linking flows defined |
| 3 | Are goals tied to a specific account? | **No. Goals are account-agnostic.** Any matching transaction can be linked regardless of account. | Assumptions updated, no accountId on Goal entity |
| 4 | Can recurring transactions be pre-linked to a goal? | **Yes.** Generated transactions inherit the goal link. If goal is no longer active, generated tx has no link. | FR-016 added, recurring module affected |
| 5 | How is the user notified when a goal auto-completes? | **Toast notification + visual badge** on goals page and projection view indicating recently completed. | FR-011 updated with notification behavior |
