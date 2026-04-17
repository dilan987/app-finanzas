# Implementation Plan: Goals V2 — Differentiated DEBT vs SAVINGS Experience

**Branch**: `005-goals-v2-enhancement` | **Date**: 2026-04-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-goals-v2-enhancement/spec.md`
**Builds on**: `004-financial-goals` (already implemented and deployed)

## Summary

Differentiate the DEBT and SAVINGS goal experiences. DEBT goals retain the current installment-based flow. SAVINGS goals drop mandatory installments and instead offer optional contribution frequency/amount plus smart projections powered by historical income data. The backend gains a new projection computation endpoint, schema fields become nullable for SAVINGS, and the frontend form/detail views adapt dynamically based on goal type.

## Technical Context

**Language/Version**: TypeScript 6  
**Primary Dependencies**: Express.js 5, React 19, Prisma 6, Zod 4, Tailwind CSS 4  
**Storage**: PostgreSQL 16  
**Testing**: Jest 30 + Supertest (backend), Vitest 4 + RTL (frontend)  
**Target Platform**: Web (Docker Compose)  
**Project Type**: web-service + SPA  
**Performance Goals**: Projections computed < 2 seconds (SC-002)  
**Constraints**: Backward-compatible with existing DEBT goals, all UI in Spanish, dark/light mode  
**Scale/Scope**: Enhancement to existing goals module — no new modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | PASS | Changes stay within `backend/src/modules/goals/` — no business logic in controllers |
| II. Type Safety | PASS | Zod schemas updated with discriminated union by type, TS interfaces updated, Prisma types regenerated |
| III. Validation at Boundaries | PASS | Zod schemas enforce DEBT requires installments, SAVINGS does not. Frontend validates before submit |
| IV. Security First | PASS | No new auth flows. Existing JWT + user scoping unchanged |
| V. Test Coverage | PASS | Projection logic will have unit tests in goals.service |
| Conventions | PASS | camelCase, standard ApiResponse, formatCurrency for projections |
| Constraints | PASS | Dark/light mode, decimal handling, user-scoped data |

## Project Structure

### Documentation (this feature)

```text
specs/005-goals-v2-enhancement/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── goals-api.md
│   └── projection-types.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code Changes

```text
backend/
├── prisma/
│   └── schema.prisma              # Goal model: new fields, nullable changes
├── src/modules/goals/
│   ├── goals.schema.ts            # Discriminated Zod schemas (DEBT vs SAVINGS)
│   ├── goals.service.ts           # Projection logic, refactored create/update/getById
│   └── goals.controller.ts        # New getProjection endpoint
└── src/modules/goals/goals.routes.ts  # New GET /:id/projection route

frontend/
├── src/types/index.ts             # Goal type updated, new Projection interface
├── src/api/goals.api.ts           # New getProjection method
├── src/pages/GoalsPage.tsx        # Form differentiation, projection display
├── src/pages/BudgetsPage.tsx      # Adapt goal display for SAVINGS type
└── src/utils/constants.ts         # CONTRIBUTION_FREQUENCIES constant
```

## Technical Approach

### 1. Schema Evolution (Prisma)

**Strategy**: Make DEBT-specific fields nullable, add SAVINGS-specific fields.

- `plannedInstallments` → `Int?` (nullable, required only for DEBT)
- `suggestedInstallment` → `Decimal? @db.Decimal(12, 2)` (nullable, only for DEBT)
- `startMonth` → `Int?` (nullable, only for DEBT)
- `startYear` → `Int?` (nullable, only for DEBT)
- `projectedEndMonth` → `Int?` (nullable, only for DEBT)
- `projectedEndYear` → `Int?` (nullable, only for DEBT)
- Add `contributionFrequency` → `ContributionFrequency?` (new enum: WEEKLY, BIWEEKLY, MONTHLY)
- Add `plannedContribution` → `Decimal? @db.Decimal(12, 2)`

**Backward compatibility**: Existing DEBT goals have all these fields populated — making them nullable doesn't break anything. New SAVINGS goals will have installment fields as null.

**Why a new enum instead of reusing Frequency?** The existing `Frequency` enum includes DAILY and YEARLY which don't apply to savings contributions. A dedicated `ContributionFrequency` enum is semantically cleaner and prevents invalid states.

### 2. Backend Validation (Zod)

**Strategy**: Use Zod discriminated union on `type` field.

- `createGoalSchema` becomes a `z.discriminatedUnion('type', [...])`:
  - **DEBT variant**: requires `plannedInstallments`, `startMonth`, `startYear` (as today)
  - **SAVINGS variant**: requires only `name`, `targetAmount`. Optional: `contributionFrequency`, `plannedContribution`
- `updateGoalSchema` adapts similarly — DEBT can update installments, SAVINGS can update contribution fields

### 3. Projection Engine (Backend Service)

**Strategy**: Pure computation functions in `goals.service.ts` — projections are NOT stored in the database.

Three projection types for SAVINGS goals:

1. **Historical projection**: Query last 6 months of INCOME transactions for the user → calculate weighted average monthly income → `(targetAmount - totalPaid) / avgMonthlyIncome = months remaining`
2. **Planned projection**: If user provided `contributionFrequency` + `plannedContribution` → convert to monthly rate (WEEKLY×4, BIWEEKLY×2, MONTHLY×1) → `(targetAmount - totalPaid) / monthlyRate = months remaining`
3. **Actual pace projection**: From linked transactions → `totalPaid / monthsElapsed = actualMonthlyRate` → `(targetAmount - totalPaid) / actualMonthlyRate = months remaining`

**Weighted average for historical**: Last 3 months weighted 2×, months 4-6 weighted 1× — smooths out volatility per edge case spec.

**Endpoint**: `GET /api/goals/:id/projection` returns a `GoalProjection` object. Called by frontend on goal detail view and after creation.

### 4. Frontend Form Differentiation

**Strategy**: Single `GoalsPage.tsx` form that renders conditionally based on `form.type`.

- Type selector at top (always visible)
- When DEBT: show installments, start month/year fields (existing behavior)
- When SAVINGS: show optional contribution frequency selector, optional planned contribution amount
- Dynamic switching: changing type resets type-specific fields

### 5. Frontend Projection Display

**Strategy**: Projection insights rendered on:
- **Goal cards** (list view): Brief projected completion or contribution info
- **Detail modal**: Full projection section with historical, planned, and actual pace insights
- **Budget page**: Adapt display — DEBT shows "cuota sugerida", SAVINGS shows projected info

All messages in Spanish using `formatCurrency`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Discriminated union in Zod | Type-safe validation that differs by goal type | Single schema with all-optional fields would allow invalid states (DEBT without installments) |
| Weighted average for historical income | Spec edge case: volatile income months | Simple average would give misleading projections when recent months differ significantly |
| Separate ContributionFrequency enum | Prevents DAILY/YEARLY for contributions | Reusing Frequency enum would allow semantically invalid values |
