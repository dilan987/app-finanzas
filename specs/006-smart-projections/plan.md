# Implementation Plan: Smart Projections — Real Savings Capacity

**Branch**: `006-smart-projections` | **Date**: 2026-04-16 | **Spec**: `specs/006-smart-projections/spec.md`
**Input**: Feature specification from `specs/006-smart-projections/spec.md`

## Summary

Replace the naive income-only projection engine with a holistic system that uses **net monthly savings** (income minus expenses, excluding transfers), **available account balances**, and **existing goal commitments** to produce realistic savings projections. No schema changes — all modifications are computation and message rendering.

## Technical Context

**Language/Version**: TypeScript 6  
**Primary Dependencies**: Express.js 5, Prisma 6, React 19, Tailwind CSS 4  
**Storage**: PostgreSQL 16  
**Testing**: Jest 30 + Supertest (backend), Vitest 4 + React Testing Library (frontend)  
**Target Platform**: Web (Docker)  
**Project Type**: web-service + SPA  
**Performance Goals**: Projection endpoint < 200ms response time  
**Constraints**: No schema migrations, computation-only changes  
**Scale/Scope**: Single service file + frontend type/rendering updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | ✅ PASS | All changes within `goals` module (service + controller) |
| II. Type Safety | ✅ PASS | GoalProjection interface extended, no `any` types |
| III. Validation at Boundaries | ✅ PASS | No new user inputs — computation-only changes |
| IV. Security First | ✅ PASS | User data scoped by userId in all queries |
| V. Test Coverage | ⚠️ NOTE | No existing tests for goals module — will not add tests per spec scope |

## Project Structure

### Documentation (this feature)

```text
specs/006-smart-projections/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── projection-api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (files to modify)

```text
backend/src/modules/goals/goals.service.ts    — Projection engine rewrite
frontend/src/types/index.ts                   — GoalProjection interface extension
frontend/src/pages/GoalsPage.tsx              — Projection message rendering
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 3 additional DB queries in projection | Need EXPENSE totals, account balances, and other goals' commitments | Single query can't aggregate across 3 different tables with different filters |

## Approach

### Backend Changes (goals.service.ts)

**1. Rewrite `getHistoricalMonthlyRate` → `getNetMonthlySavings`**

Current: queries only INCOME transactions over 6 months, weighted average.  
New: queries both INCOME and EXPENSE transactions (excluding TRANSFER) over 6 months, computes net savings per month, then applies the same weighted average.

- Query: `prisma.transaction.findMany({ where: { userId, type: { in: ['INCOME', 'EXPENSE'] }, date: { gte: sixMonthsAgo } } })`
- Group by month, compute: `monthNet = monthIncome - monthExpense`
- Apply weighted average (recent half × 2, older half × 1)
- Return `{ netMonthlySavings, monthsOfData }` instead of just a number

**2. New function: `getAvailableBalance(userId)`**

- Query: `prisma.account.aggregate({ where: { userId, isActive: true, includeInTotal: true }, _sum: { currentBalance: true } })`
- Returns the total available balance across on-budget accounts

**3. New function: `getTotalGoalCommitments(userId, excludeGoalId)`**

- Query all OTHER active SAVINGS goals with planned contributions
- Query all active DEBT goals with suggestedInstallment
- Sum their monthly rates (using frequencyToMonthlyMultiplier for SAVINGS)
- Returns total monthly commitment from other goals

**4. Enhance `getProjection` orchestrator**

- Call `getNetMonthlySavings` instead of `getHistoricalMonthlyRate`
- Call `getAvailableBalance`
- Call `getTotalGoalCommitments`
- Generate enhanced insight messages:
  - Net savings message: "Segun tu ahorro neto promedio de $X/mes (ingresos - gastos)..."
  - Negative net savings: "Tu promedio de gastos supera tus ingresos..."
  - Zero net savings: "Tu ahorro neto es $0/mes..."
  - Limited data caveat: "Basado en solo N mes(es) de datos..."
  - Balance insight: "Con tu saldo disponible de $X, necesitarias ahorrar $Y adicionales..."
  - Balance covers goal: "Tu saldo actual ya cubre esta meta..."
  - Overcommitment warning: "Tus compromisos totales en metas ($X/mes) superan tu ahorro neto..."
- Add new fields to GoalProjection response: `netMonthlySavings`, `availableBalance`, `totalGoalCommitments`, `isOvercommitted`, `monthsOfData`

**5. Preserve existing projections**

- `plannedMonthlyRate`, `actualMonthlyRate`, pace comparison — all remain unchanged
- DEBT goals: `getProjection` still returns null for historical rate (DEBT doesn't use it)

### Frontend Changes

**1. Extend GoalProjection interface** (types/index.ts)

Add: `netMonthlySavings`, `availableBalance`, `totalGoalCommitments`, `isOvercommitted`, `monthsOfData`

**2. Update GoalsPage.tsx projection rendering**

- Historical rate card: change label from "Historico" to "Ahorro Neto" when showing net savings
- Display `netMonthlySavings` value in rate card
- Render all insight messages (already dynamic — just need to ensure new messages render properly)
- Optional: show overcommitment warning with amber/warning styling
- Optional: show balance insight with a distinct visual indicator

## Post-Design Constitution Re-check

| Principle | Status |
|-----------|--------|
| I. Modular Architecture | ✅ All in goals module |
| II. Type Safety | ✅ Extended interface, no any |
| III. Validation at Boundaries | ✅ No new inputs |
| IV. Security First | ✅ userId scoped |
| V. Test Coverage | ✅ N/A (no new endpoints) |
