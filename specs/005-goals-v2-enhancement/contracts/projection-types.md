# Projection Types Contract

**Feature**: `005-goals-v2-enhancement` | **Date**: 2026-04-16

## Backend Types (TypeScript)

### GoalProjection (returned by service)

```typescript
interface GoalProjection {
  goalId: string;
  goalType: 'DEBT' | 'SAVINGS';

  // Historical income-based (SAVINGS only)
  historicalMonthlyRate: number | null;
  historicalMonthsRemaining: number | null;
  historicalCompletionDate: string | null;

  // Planned contribution-based (SAVINGS with contribution defined)
  plannedMonthlyRate: number | null;
  plannedMonthsRemaining: number | null;
  plannedCompletionDate: string | null;

  // Actual linked-transaction pace (any goal with transactions)
  actualMonthlyRate: number | null;
  actualMonthsRemaining: number | null;
  actualCompletionDate: string | null;

  // Insights
  paceStatus: 'ahead' | 'behind' | 'on_track' | 'no_data';
  insightMessages: string[];
}
```

## Frontend Types (TypeScript)

### Goal interface (updated)

```typescript
interface Goal {
  // ... existing fields ...
  
  // DEBT-only (nullable for SAVINGS)
  plannedInstallments: number | null;
  suggestedInstallment: number | null;
  startMonth: number | null;
  startYear: number | null;
  projectedEndMonth: number | null;
  projectedEndYear: number | null;

  // SAVINGS-only (nullable for DEBT)
  contributionFrequency: ContributionFrequency | null;
  plannedContribution: number | null;
}
```

### ContributionFrequency type

```typescript
type ContributionFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
```

### GoalProjection type (frontend)

```typescript
interface GoalProjection {
  goalId: string;
  goalType: GoalType;
  historicalMonthlyRate: number | null;
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
}
```

### CreateGoalData (updated — discriminated)

```typescript
// DEBT creation
interface CreateDebtGoalData {
  name: string;
  description?: string;
  type: 'DEBT';
  targetAmount: number;
  plannedInstallments: number;
  startMonth: number;
  startYear: number;
}

// SAVINGS creation
interface CreateSavingsGoalData {
  name: string;
  description?: string;
  type: 'SAVINGS';
  targetAmount: number;
  contributionFrequency?: ContributionFrequency;
  plannedContribution?: number;
}

type CreateGoalData = CreateDebtGoalData | CreateSavingsGoalData;
```

### UpdateGoalData (updated)

```typescript
interface UpdateGoalData {
  name?: string;
  description?: string | null;
  // DEBT only
  plannedInstallments?: number;
  // SAVINGS only
  contributionFrequency?: ContributionFrequency | null;
  plannedContribution?: number | null;
}
```

## Projection Computation Rules

### Monthly Rate Conversions

| Frequency | Multiplier | Example |
|-----------|-----------|---------|
| WEEKLY | × 4 | $250,000/week → $1,000,000/month |
| BIWEEKLY | × 2 | $500,000/biweek → $1,000,000/month |
| MONTHLY | × 1 | $1,000,000/month → $1,000,000/month |

### Weighted Historical Average

```
months_data = last 6 months of INCOME transactions grouped by month
recent_3 = sum of last 3 months
older_3 = sum of months 4-6

weighted_avg = (recent_3 * 2 + older_3) / (count_recent * 2 + count_older)
```

If fewer than 6 months available, use what exists with same weighting logic (recent half weighted 2×).

### Pace Status Logic

```
if no actualMonthlyRate → 'no_data'
if no plannedMonthlyRate → compare actual vs historical
if actualMonthlyRate >= plannedMonthlyRate * 1.05 → 'ahead'
if actualMonthlyRate <= plannedMonthlyRate * 0.95 → 'behind'
else → 'on_track'
```

5% tolerance band to avoid flickering between states.

### Insight Messages (Spanish)

| Condition | Message Template |
|-----------|-----------------|
| Has historical rate | "Segun tus ingresos promedio de {rate}/mes, podrias alcanzar esta meta en aproximadamente {months} meses." |
| Has planned rate | "A tu ritmo planificado de {rate}/mes, completaras esta meta en {months} meses." |
| Has actual rate | "A tu ritmo actual de {rate}/mes, completaras esta meta en aproximadamente {months} meses mas." |
| Ahead of plan | "Vas adelantado! Tu ritmo actual ({actual}/mes) supera tu plan ({planned}/mes)." |
| Behind plan | "Tu ritmo actual es menor al planificado. Considera ajustar tu plan." |
| Near completion | "Estas a solo {remaining} de completar tu meta!" |
| No data at all | "Define un aporte planificado o registra transacciones de ingreso para ver proyecciones." |
| No income history | "Registra transacciones de ingreso para obtener proyecciones automaticas." |
