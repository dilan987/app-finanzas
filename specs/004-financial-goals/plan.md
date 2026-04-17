# Implementation Plan: Financial Goals (Metas de Pago)

**Branch**: `004-financial-goals` | **Date**: 2026-04-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/004-financial-goals/spec.md`

## Summary

Add a goal-tracking system (Metas) where users create financial goals (debt payoff or savings targets) with a target amount and planned installments. Transactions are optionally linked to goals to track progress. Active goals appear in the budget projection view showing suggested vs actual monthly payments. Recurring transactions can be pre-linked to a goal so generated transactions inherit the link.

## Technical Context

**Language/Version**: TypeScript 6  
**Primary Dependencies**: Express.js 5, React 19, Prisma 6, Zod 4, Tailwind CSS 4, Recharts 3  
**Storage**: PostgreSQL 16  
**Testing**: Jest 30 + Supertest (backend), Vitest 4 + React Testing Library (frontend)  
**Target Platform**: Web (Docker)  
**Project Type**: web-service + SPA  
**Performance Goals**: Goal progress must derive from linked transactions in real-time; projection view must not add noticeable latency  
**Constraints**: Dark/light mode required, responsive design, user-scoped data, follows existing module patterns  
**Scale/Scope**: New backend module + new frontend page + modifications to 4 existing modules

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | Pass | New `goals` module follows controller/service/schema/routes pattern |
| II. Type Safety | Pass | Zod schemas for all inputs, TypeScript interfaces for frontend, Prisma types for DB |
| III. Validation at Boundaries | Pass | Zod validates goal creation/editing, frontend validates forms before submit |
| IV. Security First | Pass | Auth middleware on all goal routes, user-scoped queries |
| V. Test Coverage | Pass | Backend tests for CRUD + progress calculation, frontend tests for form + display |

## Project Structure

### Documentation (this feature)

```text
specs/004-financial-goals/
├── spec.md
├── plan.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code Changes

```text
backend/
├── prisma/
│   └── schema.prisma              # ADD Goal model, ADD goalId to Transaction + RecurringTransaction
├── src/modules/
│   └── goals/                     # NEW module
│       ├── goals.controller.ts
│       ├── goals.service.ts
│       ├── goals.schema.ts
│       ├── goals.routes.ts
│       └── goals.test.ts
├── src/modules/transactions/
│   └── transactions.service.ts    # MODIFY: handle goalId on create/update/delete
├── src/modules/recurring/
│   └── recurring.service.ts       # MODIFY: pass goalId when generating transactions
├── src/modules/budgets/
│   └── budgets.service.ts         # MODIFY: include active goals in projection summary
└── src/app.ts                     # MODIFY: register goals routes

frontend/
├── src/types/index.ts             # ADD Goal types, GoalType enum, update Transaction type
├── src/api/goals.api.ts           # NEW API module
├── src/pages/GoalsPage.tsx        # NEW page
├── src/components/forms/
│   └── TransactionForm.tsx        # MODIFY: add optional goal dropdown
├── src/pages/BudgetsPage.tsx      # MODIFY: show active goals in projection
├── src/pages/RecurringPage.tsx    # MODIFY: add optional goal dropdown
├── src/routes/AppRoutes.tsx       # MODIFY: add /goals route
├── src/components/layout/
│   ├── Sidebar.tsx                # MODIFY: add "Metas" nav item
│   └── BottomTabBar.tsx           # MODIFY: add "Metas" to mobile more menu
└── src/utils/constants.ts         # ADD goal-related constants
```

## Data Model

### New: Goal

```prisma
enum GoalType {
  DEBT
  SAVINGS
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

model Goal {
  id                    String     @id @default(uuid())
  name                  String
  description           String?
  type                  GoalType
  status                GoalStatus @default(ACTIVE)
  targetAmount          Decimal    @db.Decimal(12, 2)
  plannedInstallments   Int
  suggestedInstallment  Decimal    @db.Decimal(12, 2)
  startMonth            Int
  startYear             Int
  projectedEndMonth     Int
  projectedEndYear      Int
  userId                String
  user                  User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions          Transaction[]
  recurringTransactions RecurringTransaction[]
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt

  @@index([userId])
  @@index([userId, status])
}
```

### Modified: Transaction

```prisma
model Transaction {
  // ... existing fields ...
  goalId    String?
  goal      Goal?    @relation(fields: [goalId], references: [id], onDelete: SetNull)
}
```

### Modified: RecurringTransaction

```prisma
model RecurringTransaction {
  // ... existing fields ...
  goalId    String?
  goal      Goal?    @relation(fields: [goalId], references: [id], onDelete: SetNull)
}
```

**Design decisions:**
- `goalId` on Transaction uses `onDelete: SetNull` — if a goal is deleted/cancelled, transactions keep their data but lose the link
- `suggestedInstallment` is stored (computed at creation: targetAmount / plannedInstallments) for query efficiency
- Progress is always derived: `SUM(linked transactions amounts) / targetAmount * 100`
- `startMonth/startYear` + `projectedEndMonth/projectedEndYear` define the active range for projection view queries

## API Endpoints

### Goals Module

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals` | List goals (filterable by status, type) |
| GET | `/api/goals/:id` | Get goal detail with linked transactions and progress |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal (name, description, plannedInstallments) |
| PATCH | `/api/goals/:id/cancel` | Cancel a goal |
| POST | `/api/goals/:id/link` | Link an existing transaction to a goal (from goal detail view) |
| DELETE | `/api/goals/:id/unlink/:transactionId` | Unlink a transaction from a goal |
| GET | `/api/goals/active-for-month` | Get active goals for a specific month/year (used by projection) |

### Modified Endpoints

| Method | Path | Change |
|--------|------|--------|
| POST | `/api/transactions` | Accept optional `goalId`, validate goal exists and is active, validate type match |
| PUT | `/api/transactions/:id` | Accept optional `goalId` change |
| DELETE | `/api/transactions/:id` | No change needed (goal progress derives from remaining linked tx) |
| GET | `/api/budgets/summary` | Include `activeGoals` array in response with per-goal installment, actual paid this month, progress |

## Frontend Architecture

### GoalsPage Layout (Responsive)

```
Desktop (lg+):
┌─────────────────────────────────────────────────────┐
│ Metas                                    [+ Nueva]  │
├──────────┬──────────┬──────────┬───────────────────┤
│ Total    │ Total    │ Progreso │ Metas             │
│ Comprom. │ Pagado   │ General  │ Activas           │
├──────────┴──────────┴──────────┴───────────────────┤
│ Filter tabs: [Activas] [Completadas] [Canceladas]   │
├─────────────────────┬───────────────────────────────┤
│ Goal Card 1         │ Goal Card 2                   │
│ ┌─────────────────┐ │ ┌─────────────────────────┐   │
│ │ Name    [badge] │ │ │ Name    [badge]         │   │
│ │ $paid / $target │ │ │ $paid / $target         │   │
│ │ ████████░░ 65%  │ │ │ ██░░░░░░░░ 20%          │   │
│ │ Cuota: $500K/m  │ │ │ Cuota: $300K/m          │   │
│ │ 3/5 meses       │ │ │ 1/10 meses              │   │
│ └─────────────────┘ │ └─────────────────────────┘   │
└─────────────────────┴───────────────────────────────┘

Mobile (< lg):
┌───────────────────────┐
│ Metas          [+ ]   │
├───────────┬───────────┤
│ Comprom.  │ Pagado    │
├───────────┼───────────┤
│ Progreso  │ Activas   │
├───────────┴───────────┤
│ [Activas][Comp][Canc] │
├───────────────────────┤
│ Goal Card 1 (full w)  │
├───────────────────────┤
│ Goal Card 2 (full w)  │
└───────────────────────┘
```

### Goal Detail View (Modal or inline expand)

```
┌───────────────────────────────────────┐
│ Meta: Laptop                  [Edit]  │
│ Deuda · $2,500,000 · 5 cuotas        │
│                                       │
│ ████████████████░░░░░░░ 65%           │
│ $1,625,000 / $2,500,000               │
│                                       │
│ Cuota sugerida: $500,000/mes          │
│ Inicio: Abr 2026 → Ago 2026          │
│                                       │
│ Transacciones vinculadas:             │
│ ┌───────────────────────────────────┐ │
│ │ 15 Abr  Pago laptop  -$500,000   │ │
│ │ 12 May  Pago laptop  -$625,000   │ │
│ │ 10 Jun  Pago laptop  -$500,000   │ │
│ └───────────────────────────────────┘ │
│                                       │
│ [+ Vincular transaccion existente]    │
│                                       │
│ Desglose mensual:                     │
│ Abr: $500K ✓  May: $625K ✓           │
│ Jun: $500K ✓  Jul: $0 pending        │
│ Ago: $0 pending                       │
└───────────────────────────────────────┘
```

### Budget Projection Integration

```
Existing projection view + new Goals section:

┌─────────────────────────────────────────┐
│ ... existing budget items ...           │
├─────────────────────────────────────────┤
│ Metas activas este mes            (3)  │
├─────────────────────────────────────────┤
│ 🎯 Laptop (Deuda)                      │
│    Cuota sugerida: $500,000             │
│    Pagado este mes: $500,000  ✓         │
│    Progreso total: ████████░░ 80%       │
├─────────────────────────────────────────┤
│ 🎯 Vacaciones (Ahorro)                 │
│    Cuota sugerida: $300,000             │
│    Ahorrado este mes: $450,000  ↑       │
│    Progreso total: ██████░░░░ 55%       │
├─────────────────────────────────────────┤
│ Total compromiso metas: $800,000        │
│ Total pagado este mes:  $950,000        │
└─────────────────────────────────────────┘
```

### TransactionForm Goal Dropdown

- New optional `Select` field: "Vincular a meta (opcional)"
- Only visible for EXPENSE (shows debt goals) and INCOME (shows savings goals)
- Hidden for TRANSFER type
- Loads active goals from `/api/goals?status=ACTIVE`
- Default: empty (no goal linked)

### RecurringPage Goal Dropdown

- Same pattern as TransactionForm
- When a recurring template has a goalId, generated transactions inherit it

## Implementation Phases

### Phase 1: Data Model & Backend Core (P1 stories)
1. Prisma schema changes (Goal model, goalId on Transaction + RecurringTransaction)
2. Migration
3. Goals module: CRUD + progress calculation
4. Modify transactions service: handle goalId
5. Modify budgets service: include goals in projection
6. Modify recurring service: inherit goalId
7. Backend tests

### Phase 2: Frontend Core (P1 stories)
1. Types + API module
2. GoalsPage: list, create, filter by status
3. Goal detail view with linked transactions + monthly breakdown
4. TransactionForm: goal dropdown
5. BudgetsPage: active goals section in projection
6. Navigation: sidebar + bottom tab bar + routing

### Phase 3: Polish (P2 stories)
1. RecurringPage: goal dropdown
2. Goal edit/cancel flows
3. Auto-complete detection + toast + badge
4. Link existing transactions from goal detail
5. Summary stats on GoalsPage
6. Responsive testing + dark mode verification

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Goal progress is derived (not stored) | Ensures consistency when tx are edited/deleted | Stored progress would require sync logic on every tx mutation — more complex to maintain |
| Two linking flows (form + goal detail) | User requested both; retroactive linking is essential UX | Single flow (form only) would make it impossible to link forgotten transactions |
| suggestedInstallment stored on Goal | Avoids recalculating on every list/projection query | Computing on-the-fly is viable but adds unnecessary load for a value that only changes on goal edit |
