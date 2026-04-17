# Feature Specification: Smart Projections — Real Savings Capacity

**Feature Branch**: `006-smart-projections`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Fix savings goal projections to use real savings capacity instead of raw income. Projections should analyze net savings (income - expenses), current balances, existing goal commitments, and disposable savings capacity."  
**Builds on**: `005-goals-v2-enhancement` (already implemented)

## Context

The current projection engine for SAVINGS goals uses only INCOME transaction history to estimate time-to-completion. This produces misleading results — telling a user "at your income of $4,660,000/month you'll reach $20M in 5 months" ignores the fact that most of that income goes to expenses, other goals, and fixed obligations. The user sees an unrealistically optimistic projection that erodes trust in the system.

The projection must shift from "how much you earn" to "how much you actually save" — factoring in all the user's financial data to give genuinely useful, realistic estimates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Net Savings-Based Projection (Priority: P1)

As a user viewing my savings goal, I want the projection to tell me how long it will take based on how much I **actually save each month** (income minus expenses), not just my raw income. If I earn $4,660,000/month but spend $3,800,000, my real savings rate is $860,000/month — and the projection should reflect that.

**Why this priority**: This is the core fix. Without this, all SAVINGS projections are misleading.

**Independent Test**: User with 6 months of income ($4,660,000/month avg) and expenses ($3,800,000/month avg) creates a $20,000,000 savings goal. Projection should show ~23 months based on $860,000/month net savings, NOT ~5 months based on raw income.

**Acceptance Scenarios**:

1. **Given** I have 6 months of history with avg income $4,660,000 and avg expenses $3,800,000, **When** I view my $20,000,000 savings goal projection, **Then** the system shows: "Segun tu ahorro neto promedio de $860,000/mes (ingresos - gastos), podrias alcanzar esta meta en aproximadamente 23 meses."
2. **Given** I have 3 months of history with avg income $2,000,000 and avg expenses $2,100,000 (net negative), **When** I view the projection, **Then** the system shows: "Tu promedio de gastos supera tus ingresos. Revisa tu presupuesto para poder ahorrar hacia esta meta."
3. **Given** I have no transaction history, **When** I view the projection, **Then** the system shows the planned contribution projection (if set) or the fallback "no data" message — never a raw income projection.

---

### User Story 2 - Balance-Aware Projection (Priority: P1)

As a user, I want the projection to factor in my current available balance across my accounts. If I already have $5,000,000 saved across my accounts and need $20,000,000, the projection should acknowledge that existing capital accelerates the goal.

**Why this priority**: Users with existing balances get overly pessimistic projections if the system only considers future monthly savings.

**Independent Test**: User with $5,000,000 across on-budget accounts, net savings of $860,000/month, creates a $20,000,000 goal. Projection should mention the balance optionally: "Con tu saldo disponible de $5,000,000, necesitarias ahorrar $15,000,000 adicionales (~17 meses a tu ritmo actual)."

**Acceptance Scenarios**:

1. **Given** I have $5,000,000 across on-budget accounts and net savings of $860,000/month, **When** I view my $20,000,000 goal, **Then** I see a secondary insight: "Con tu saldo disponible de $5,000,000, necesitarias ahorrar $15,000,000 adicionales (~17 meses a tu ritmo actual)."
2. **Given** I have $0 across accounts, **When** I view the projection, **Then** the balance insight does NOT appear (no misleading "saldo de $0" message).
3. **Given** my balance alone exceeds the goal target, **When** I view the projection, **Then** the system shows: "Tu saldo actual ya cubre esta meta. Puedes completarla cuando quieras!"

---

### User Story 3 - Goal Competition Awareness (Priority: P2)

As a user with multiple active savings goals, I want the system to warn me if my net savings can't realistically cover all my goal commitments simultaneously. If I have 3 goals each expecting $500,000/month but I only save $860,000 total, the projections should reflect the shared capacity.

**Why this priority**: Without this, each goal shows an optimistic individual projection that doesn't account for the others.

**Independent Test**: User with $860,000/month net savings has 2 active savings goals each with planned contribution of $500,000/month. The projection for each should note that total commitments ($1,000,000) exceed net savings ($860,000).

**Acceptance Scenarios**:

1. **Given** I have net savings of $860,000/month and 2 goals with total planned contributions of $1,000,000/month, **When** I view any goal's projection, **Then** I see a warning: "Tus compromisos totales en metas ($1,000,000/mes) superan tu ahorro neto ($860,000/mes). Considera priorizar tus metas."
2. **Given** I have net savings of $2,000,000/month and total goal commitments of $800,000/month, **When** I view projections, **Then** no warning appears (capacity is sufficient).

---

### Edge Cases

- What happens when the user has only 1 month of history? Use that month's data but caveat: "Basado en solo 1 mes de datos. La precision mejorara con mas historial."
- What happens when net savings are exactly $0? Show: "Tu ahorro neto es $0/mes. Reduce gastos o aumenta ingresos para avanzar en esta meta."
- What happens when the user has TRANSFER transactions? Transfers between accounts are NOT income or expenses — they must be excluded from the net savings calculation.
- What happens when the goal already has linked transactions (totalPaid > 0)? The remaining amount (target - totalPaid) is what needs to be projected, as it already works today.
- What happens with accounts marked `includeInTotal: false`? Those accounts should NOT be counted in the available balance calculation since the user opted them out.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The historical projection MUST use **net monthly savings** (total INCOME minus total EXPENSES, excluding TRANSFERS) instead of raw income.
- **FR-002**: The system MUST calculate net savings using the same weighted average as before (recent 3 months × 2, older 3 months × 1) but applied to net savings instead of income.
- **FR-003**: When net savings are zero or negative, the system MUST NOT show a time projection. Instead it MUST show a diagnostic message about spending exceeding income.
- **FR-004**: The system MUST calculate the user's available balance as the sum of `currentBalance` across all accounts where `includeInTotal = true` and `isActive = true`.
- **FR-005**: When available balance > 0, the system MUST show a secondary insight indicating how the existing balance reduces the savings needed (target - totalPaid - availableBalance = remaining to save through monthly contributions).
- **FR-006**: When available balance alone covers the remaining goal amount, the system MUST show an encouraging message that the goal is already within reach.
- **FR-007**: The system MUST calculate total monthly goal commitments as the sum of all OTHER active goals' planned monthly contributions (excluding the current goal being viewed).
- **FR-008**: When total goal commitments exceed net monthly savings, the system MUST show a warning about overcommitment.
- **FR-009**: All existing projection features (planned contribution projection, actual pace projection, pace comparison) MUST continue to work as before.
- **FR-010**: The "historical projection" label/message MUST change from "ingresos promedio" to "ahorro neto promedio" to accurately describe what it measures.
- **FR-011**: All messages MUST remain in Spanish and use the app's currency formatting.

### Key Entities *(no new entities — changes to computation only)*

- **GoalProjection (enhanced)**: The existing computed projection object gains: `netMonthlySavings` (income - expenses avg), `availableBalance` (sum of active on-budget accounts), `totalGoalCommitments` (other goals' monthly planned contributions), `isOvercommitted` (boolean).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with income $4,660,000/month and expenses $3,800,000/month sees a ~23 month projection for a $20M goal, NOT a ~5 month projection.
- **SC-002**: The projection message explicitly says "ahorro neto" (not "ingresos") so users understand the calculation basis.
- **SC-003**: A user with $5M in accounts sees a balance-aware insight alongside the monthly projection.
- **SC-004**: A user with overcommitted goals sees a warning about total commitments exceeding savings.
- **SC-005**: Existing projection features (planned pace, actual pace, pace comparison) remain unchanged.
- **SC-006**: DEBT goal projections remain completely unaffected.

## Assumptions

- Net savings = SUM(INCOME transactions) - SUM(EXPENSE transactions) over the period, excluding TRANSFER type.
- Available balance uses only active accounts with `includeInTotal = true` — this respects the user's account configuration.
- Goal commitments from DEBT goals use `suggestedInstallment`; from SAVINGS goals use `plannedContribution × frequency multiplier`.
- The balance insight is informational — the system does NOT automatically deduct from accounts or suggest the user should drain their accounts.
- This change only affects the projection computation on the backend and message rendering on the frontend — no schema changes needed.
