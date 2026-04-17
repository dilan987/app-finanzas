# Data Model: 006-smart-projections

## No Schema Changes

This feature modifies **computation only**. No new tables, columns, or enums.

## Existing Models Used

### Transaction (read-only)
- `type: TransactionType` — filter by INCOME/EXPENSE, exclude TRANSFER
- `amount: Decimal` — sum per month
- `date: DateTime` — group by month, filter last 6 months
- `userId: String` — scope to current user

### Account (read-only)
- `currentBalance: Decimal` — sum for available balance
- `isActive: Boolean` — filter active accounts
- `includeInTotal: Boolean` — filter on-budget accounts
- `userId: String` — scope to current user

### Goal (read-only for commitment query)
- `type: GoalType` — DEBT vs SAVINGS determines rate calculation
- `status: GoalStatus` — filter ACTIVE only
- `suggestedInstallment: Decimal?` — DEBT monthly rate
- `contributionFrequency: ContributionFrequency?` — SAVINGS frequency
- `plannedContribution: Decimal?` — SAVINGS contribution amount
- `userId: String` — scope to current user

## Enhanced Computed Object

### GoalProjection (extended)

```typescript
interface GoalProjection {
  // Existing fields (unchanged)
  goalId: string;
  goalType: string;
  historicalMonthlyRate: number | null;   // now = net savings rate
  historicalMonthsRemaining: number | null;
  historicalCompletionDate: string | null;
  plannedMonthlyRate: number | null;
  plannedMonthsRemaining: number | null;
  plannedCompletionDate: string | null;
  actualMonthlyRate: number | null;
  actualMonthsRemaining: number | null;
  actualCompletionDate: string | null;
  paceStatus: 'ahead' | 'behind' | 'on_track' | 'no_data';
  insightMessages: string[];

  // New fields
  netMonthlySavings: number | null;        // income - expenses avg
  availableBalance: number;                 // sum of active on-budget accounts
  totalGoalCommitments: number;             // other goals' monthly rates
  isOvercommitted: boolean;                 // commitments > net savings
  monthsOfData: number;                     // how many months of tx history
}
```
