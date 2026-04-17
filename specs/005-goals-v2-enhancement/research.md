# Research: Goals V2 — DEBT vs SAVINGS Differentiation

**Feature**: `005-goals-v2-enhancement` | **Date**: 2026-04-16

## Decision 1: Projection Computation Strategy

**Decision**: Compute projections on-demand via API endpoint, NOT stored in database.

**Rationale**: Projections depend on mutable external data (income transactions, linked transactions) that change frequently. Storing projections would require recalculation triggers on every transaction create/update/delete — complex and error-prone. On-demand computation with the small dataset involved (6 months of transactions per user) is fast enough (< 100ms query).

**Alternatives considered**:
- *Materialized/cached projections*: Rejected — adds complexity with stale data risk, and the query is cheap enough to run live.
- *Frontend-only calculation*: Rejected — would require sending raw transaction history to frontend and duplicating business logic.

## Decision 2: Historical Income Averaging Method

**Decision**: Weighted average over last 6 months — last 3 months weighted 2×, months 4-6 weighted 1×.

**Rationale**: Spec edge case requires handling volatile income. A simple average treats a $5M month from 6 months ago equally with a recent $500K month. Weighted average gives recency bias, producing more actionable projections. Formula: `(sum_recent_3 * 2 + sum_older_3 * 1) / (3 * 2 + 3 * 1)`.

**Alternatives considered**:
- *Simple arithmetic mean*: Rejected — misleading when income varies significantly month-to-month.
- *Median*: Rejected — loses information about magnitude and doesn't weight recency.
- *Exponential moving average*: Rejected — overly complex for 6 data points, harder to explain to users.

## Decision 3: New Enum vs Reusing Frequency

**Decision**: Create new `ContributionFrequency` enum with values WEEKLY, BIWEEKLY, MONTHLY.

**Rationale**: The existing `Frequency` enum (DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY) includes DAILY and YEARLY which are semantically invalid for savings contributions. A dedicated enum prevents invalid states at the schema level.

**Alternatives considered**:
- *Reuse Frequency enum*: Rejected — would require runtime validation to exclude DAILY/YEARLY, violating constitution principle II (type safety).
- *String field with validation*: Rejected — loses Prisma enum benefits (DB-level constraint, TypeScript union type).

## Decision 4: Schema Migration Strategy

**Decision**: Make DEBT-specific fields nullable (not removed) using `prisma db push`.

**Rationale**: Existing DEBT goals already have these fields populated. Making them nullable is non-destructive — existing data is untouched. New SAVINGS goals simply don't populate them. This avoids data migration scripts.

**Alternatives considered**:
- *Split into separate GoalDebt/GoalSavings models*: Rejected — overcomplicated, breaks existing relations and queries.
- *Keep fields required with default values for SAVINGS*: Rejected — pollutes SAVINGS goals with meaningless data (installments=0, startMonth=0).

## Decision 5: Projection Endpoint Design

**Decision**: Dedicated `GET /api/goals/:id/projection` endpoint returning a `GoalProjection` object.

**Rationale**: Separating projection from the main goal GET keeps the base endpoint fast and simple. The projection endpoint does heavier computation (income aggregation) and is called only when the user views goal details or after creation. This also allows future caching if needed.

**Alternatives considered**:
- *Embed projections in GET /goals/:id*: Rejected — adds latency to every goal detail fetch even when projections aren't needed (e.g., DEBT goals).
- *Query parameter `?include=projection`*: Viable but adds conditional complexity to the controller. Separate endpoint is cleaner.

## Decision 6: Frontend Form Strategy

**Decision**: Single form component with conditional rendering based on `type` field selection.

**Rationale**: The two forms share common fields (name, description, target amount) and differ only in type-specific sections. A single component with conditional blocks is simpler than two separate form components and easier to maintain.

**Alternatives considered**:
- *Two separate form components (DebtGoalForm, SavingsGoalForm)*: Rejected — would duplicate shared field logic, state management, and submission handling.
