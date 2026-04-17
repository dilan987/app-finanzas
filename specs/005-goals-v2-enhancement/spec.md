# Feature Specification: Goals V2 — Differentiated DEBT vs SAVINGS Experience

**Feature Branch**: `005-goals-v2-enhancement`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Enhanced Financial Goals v2: Differentiated goal experiences for DEBT vs SAVINGS types. DEBT goals keep installment-based flow. SAVINGS goals remove mandatory installments, add optional contribution frequency/amount, and provide smart projections based on historical income data."  
**Builds on**: `004-financial-goals` (already implemented)

## Context

The current goals system treats DEBT and SAVINGS identically — both require a mandatory number of installments. This doesn't match real user behavior:

- **DEBT** goals are structured: "I owe $2.5M, I'll pay in 5 months" — installments make sense.
- **SAVINGS** goals are aspirational: "I want a motorcycle worth $19M" — the user may not know when they'll reach it. They want the system to analyze their income patterns and tell them "at your current savings rate, you'll get there in X months."

This spec describes changes to the existing goals module to differentiate the two experiences.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a SAVINGS Goal with Smart Projections (Priority: P1)

As a user, I want to create a savings goal where I just define the target amount and optionally say how much and how often I plan to contribute. The system should analyze my historical savings/income and tell me when I'll likely reach my goal — motivating me with realistic projections.

For example, I want a motorcycle worth $19,000,000. I create a savings goal with just the name and target amount. The system looks at my last 6 months of income transactions and tells me: "Based on your average monthly savings of $850,000, you'll reach this goal in approximately 22 months (February 2028)." If I also tell it I plan to contribute $1,000,000/month, it shows a second projection: "At your planned pace of $1,000,000/month, you'll reach this goal in 19 months (November 2027)."

**Why this priority**: This is the core differentiation. Without this, savings goals remain identical to debt goals.

**Independent Test**: Create a savings goal with only name + target. Verify the system calculates a projection based on historical data. Then create one with a planned contribution and verify both projections appear.

**Acceptance Scenarios**:

1. **Given** I select type "Ahorro", **When** the form renders, **Then** installments fields are hidden. Instead I see: target amount, optional contribution frequency, optional planned contribution amount.
2. **Given** I have 6 months of income transaction history averaging $2,500,000/month, **When** I create a savings goal for $19,000,000, **Then** the system shows: "Segun tus ingresos promedio de $2,500,000/mes, podrias alcanzar esta meta en aproximadamente 8 meses."
3. **Given** I create a savings goal for $19,000,000 with planned contribution of $1,000,000/month, **When** the goal is created, **Then** the system shows both: the planned projection ("A tu ritmo planificado de $1,000,000/mes, completaras esta meta en 19 meses") AND the historical projection.
4. **Given** I have no income history, **When** I create a savings goal, **Then** the system only shows the planned contribution projection (if provided), or a message: "Registra transacciones de ingreso para obtener proyecciones automaticas."

---

### User Story 2 - DEBT Form Stays As-Is (Priority: P1)

As a user creating a debt goal, the experience should remain unchanged: I define the target amount, number of installments, and start month. The system calculates the suggested monthly payment and projected end date.

**Why this priority**: We must not break the existing DEBT flow while enhancing SAVINGS.

**Independent Test**: Create a debt goal. Verify the form still shows installments, start month/year, and the suggested payment calculation works identically to v1.

**Acceptance Scenarios**:

1. **Given** I select type "Deuda", **When** the form renders, **Then** I see all current fields: target amount, planned installments, start month, start year.
2. **Given** I create a debt goal for $2,500,000 in 5 installments starting April 2026, **When** created, **Then** suggested installment is $500,000/month and projected end is August 2026 — exactly as before.

---

### User Story 3 - Savings Goal Detail with Projection Insights (Priority: P1)

As a user viewing a savings goal detail, I want to see a projection/insights section that shows: my actual pace vs. planned pace, time-to-completion estimate based on real linked transactions, and motivational feedback.

**Why this priority**: Projections at creation are useful, but ongoing insights during the life of the goal keep users engaged.

**Independent Test**: Create a savings goal, link some transactions over 2+ months. View the detail. Verify projections update based on actual linked transaction pace.

**Acceptance Scenarios**:

1. **Given** I have a savings goal of $19,000,000 with $3,000,000 saved over 2 months, **When** I view the detail, **Then** I see: "A tu ritmo actual de $1,500,000/mes, completaras esta meta en aproximadamente 11 meses mas."
2. **Given** I have a savings goal with planned contribution of $1,000,000/month but I've actually been saving $1,500,000/month, **When** I view the detail, **Then** I see: "Vas adelantado! Tu ritmo actual ($1,500,000/mes) supera tu plan ($1,000,000/mes)."
3. **Given** I have a savings goal with no linked transactions yet, **When** I view the detail, **Then** projections show the planned pace (if set) and/or historical income projection.

---

### User Story 4 - Contribution Frequency on Savings Goals (Priority: P2)

As a user, when creating a savings goal I want to optionally specify how often I plan to contribute (weekly, biweekly, monthly) and how much per contribution, so the system can give me a more accurate projection.

**Why this priority**: Enhances projection accuracy but the core value works with just the target amount + historical data.

**Independent Test**: Create a savings goal with biweekly contribution of $500,000. Verify the projection calculates based on ~2 contributions per month.

**Acceptance Scenarios**:

1. **Given** I create a savings goal with frequency "Quincenal" and amount $500,000, **When** created, **Then** the system calculates ~$1,000,000/month and projects completion accordingly.
2. **Given** I create a savings goal with frequency "Semanal" and amount $250,000, **When** created, **Then** the system calculates ~$1,000,000/month (4 weeks).
3. **Given** I create a savings goal with no contribution frequency or amount, **When** created, **Then** the system relies solely on historical data for projections.

---

### Edge Cases

- What happens when a savings goal has no planned contribution AND no historical income data? Show message: "Define un aporte planificado o registra transacciones de ingreso para ver proyecciones."
- What happens when a user switches goal type from DEBT to SAVINGS in the form? The form fields change dynamically — installments/start date fields hide, contribution fields appear.
- What happens when the user's historical income varies wildly month to month? Use a weighted average (recent months weighted more) and show a range: "entre X y Y meses."
- What happens when a savings goal is almost complete? Show encouraging message: "Estas a solo $X de completar tu meta!"
- What happens when actual savings pace is slower than planned? Show: "Tu ritmo actual es menor al planificado. Considera ajustar tu plan."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a different creation form based on goal type selection — DEBT form with installments/start date, SAVINGS form with optional contribution frequency and amount.
- **FR-002**: SAVINGS goals MUST NOT require planned installments or start month/year. Only name, target amount are required. Contribution frequency and planned amount are optional.
- **FR-003**: DEBT goals MUST retain the current creation flow: name, target amount, planned installments, start month/year — all required.
- **FR-004**: System MUST calculate historical savings projection for SAVINGS goals using the user's average monthly income from the last 6 months of INCOME transactions.
- **FR-005**: System MUST calculate planned contribution projection for SAVINGS goals when the user provides a contribution amount and frequency.
- **FR-006**: System MUST display projection insights on the SAVINGS goal card (in goals list) and in the goal detail view.
- **FR-007**: System MUST display real-time updated projections in the SAVINGS goal detail based on actual linked transaction pace (total paid / months elapsed = actual monthly rate, then target remaining / actual rate = months to go).
- **FR-008**: System MUST show comparative insights when both planned and actual pace are available (ahead/behind/on track).
- **FR-009**: System MUST support contribution frequencies: WEEKLY, BIWEEKLY, MONTHLY for savings goals. Monthly equivalent: WEEKLY * 4, BIWEEKLY * 2, MONTHLY * 1.
- **FR-010**: SAVINGS goals in the database MUST store: contributionFrequency (nullable), plannedContribution (nullable). Fields plannedInstallments, startMonth, startYear, projectedEndMonth, projectedEndYear become nullable — only required for DEBT goals.
- **FR-011**: The goals list and budget projection view MUST adapt display based on goal type — DEBT shows "cuota sugerida", SAVINGS shows projected completion or contribution info.
- **FR-012**: All projection messages MUST be in Spanish and use the app's currency formatting.
- **FR-013**: When no data is available for projections, system MUST show a helpful fallback message instead of empty/broken projections.

### Key Entities *(include if feature involves data)*

- **Goal (enhanced)**: Existing Goal entity gains two new optional fields: `contributionFrequency` (enum: WEEKLY, BIWEEKLY, MONTHLY, nullable — only for SAVINGS), `plannedContribution` (decimal, nullable — the amount per contribution). Fields `plannedInstallments`, `startMonth`, `startYear`, `projectedEndMonth`, `projectedEndYear` become nullable (null for SAVINGS goals that don't define them).
- **Projection (computed, not stored)**: A computed data object returned by the API containing: `historicalMonthlyRate`, `plannedMonthlyRate`, `actualMonthlyRate`, `projectedCompletionDate`, `projectedMonthsRemaining`, `paceStatus` (ahead/behind/on_track), and `insightMessage`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creating a SAVINGS goal does NOT require installments — only name and target amount are mandatory.
- **SC-002**: A savings goal with user income history shows a realistic projection within 2 seconds of creation.
- **SC-003**: Projection insights update as transactions are linked — the estimated completion date recalculates.
- **SC-004**: DEBT goal flow is completely unchanged from v1.
- **SC-005**: All projections display correctly in both mobile and desktop, light and dark modes.
- **SC-006**: Fallback messages display when insufficient data exists for projections.

## Assumptions

- The user has the existing goals module from 004-financial-goals deployed and working.
- Historical income data (INCOME transactions) is the basis for savings projections — not expense savings (income - expenses).
- The 6-month lookback window is a sensible default for income averaging.
- Contribution frequency is a planning tool — the system doesn't enforce it or create automatic transactions.
- DEBT goals are fully backward-compatible — no changes to existing debt goal records.
