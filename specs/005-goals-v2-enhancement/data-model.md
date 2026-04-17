# Data Model: Goals V2 — DEBT vs SAVINGS Differentiation

**Feature**: `005-goals-v2-enhancement` | **Date**: 2026-04-16

## Schema Changes

### New Enum: ContributionFrequency

```prisma
enum ContributionFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
}
```

### Modified Model: Goal

```prisma
model Goal {
  id                   String                 @id @default(uuid())
  name                 String
  description          String?
  type                 GoalType
  status               GoalStatus             @default(ACTIVE)
  targetAmount         Decimal                @db.Decimal(12, 2)

  // ── DEBT-only fields (nullable — populated only for DEBT goals) ──
  plannedInstallments  Int?
  suggestedInstallment Decimal?               @db.Decimal(12, 2)
  startMonth           Int?
  startYear            Int?
  projectedEndMonth    Int?
  projectedEndYear     Int?

  // ── SAVINGS-only fields (nullable — populated only for SAVINGS goals) ──
  contributionFrequency ContributionFrequency?
  plannedContribution   Decimal?              @db.Decimal(12, 2)

  // ── Common fields ──
  userId               String
  user                 User                   @relation(fields: [userId], references: [id], onDelete: Cascade)

  transactions          Transaction[]
  recurringTransactions RecurringTransaction[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([userId, status])
}
```

### Field Change Summary

| Field | Before | After | Reason |
|-------|--------|-------|--------|
| `plannedInstallments` | `Int` (required) | `Int?` (nullable) | Not applicable to SAVINGS goals |
| `suggestedInstallment` | `Decimal` (required) | `Decimal?` (nullable) | Only calculated for DEBT goals |
| `startMonth` | `Int` (required) | `Int?` (nullable) | SAVINGS goals don't have a fixed start month |
| `startYear` | `Int` (required) | `Int?` (nullable) | SAVINGS goals don't have a fixed start year |
| `projectedEndMonth` | `Int` (required) | `Int?` (nullable) | SAVINGS projections are computed dynamically |
| `projectedEndYear` | `Int` (required) | `Int?` (nullable) | SAVINGS projections are computed dynamically |
| `contributionFrequency` | N/A | `ContributionFrequency?` (new) | Optional savings contribution frequency |
| `plannedContribution` | N/A | `Decimal?` (new) | Optional savings contribution amount per period |

### Computed Type: GoalProjection (NOT stored)

Returned by `GET /api/goals/:id/projection` — computed on-demand from transaction data.

```typescript
interface GoalProjection {
  goalId: string;
  goalType: GoalType;

  // Historical income-based projection (SAVINGS only)
  historicalMonthlyRate: number | null;       // avg monthly income (weighted)
  historicalMonthsRemaining: number | null;   // months to target at historical rate
  historicalCompletionDate: string | null;     // ISO date estimate

  // Planned contribution projection (SAVINGS only, if user defined contribution)
  plannedMonthlyRate: number | null;          // contribution converted to monthly
  plannedMonthsRemaining: number | null;
  plannedCompletionDate: string | null;

  // Actual pace projection (any goal with linked transactions)
  actualMonthlyRate: number | null;           // totalPaid / monthsElapsed
  actualMonthsRemaining: number | null;
  actualCompletionDate: string | null;

  // Comparative insights
  paceStatus: 'ahead' | 'behind' | 'on_track' | 'no_data';
  insightMessages: string[];                  // Spanish insight messages
}
```

## Migration Impact

- **Existing DEBT goals**: No data loss. All currently-required fields remain populated. The only change is they become nullable at schema level.
- **New SAVINGS goals**: Created with installment fields as `null`, contribution fields optionally populated.
- **Queries affected**: `getActiveForMonth` must handle nullable `startMonth`/`startYear`/`projectedEndMonth`/`projectedEndYear` for SAVINGS goals. SAVINGS goals are always "active for month" (no date range filtering).
- **Budget projection**: Must handle `suggestedInstallment` being null for SAVINGS goals — display contribution info instead.
