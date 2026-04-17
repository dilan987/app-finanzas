# Quickstart Validation: Goals V2

**Feature**: `005-goals-v2-enhancement` | **Date**: 2026-04-16

## Key Validation Scenarios

### 1. Create SAVINGS goal (minimal — name + target only)

```bash
curl -X POST http://localhost:4000/api/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Moto nueva", "type": "SAVINGS", "targetAmount": 19000000}'
```

**Expected**: 201, goal created with `plannedInstallments: null`, `startMonth: null`, `contributionFrequency: null`, `plannedContribution: null`.

### 2. Create SAVINGS goal (with contribution plan)

```bash
curl -X POST http://localhost:4000/api/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Fondo de emergencia", "type": "SAVINGS", "targetAmount": 10000000, "contributionFrequency": "BIWEEKLY", "plannedContribution": 500000}'
```

**Expected**: 201, goal created with `contributionFrequency: "BIWEEKLY"`, `plannedContribution: 500000`.

### 3. Create DEBT goal (unchanged behavior)

```bash
curl -X POST http://localhost:4000/api/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Tarjeta Visa", "type": "DEBT", "targetAmount": 2500000, "plannedInstallments": 5, "startMonth": 4, "startYear": 2026}'
```

**Expected**: 201, goal created with `suggestedInstallment: 500000`, `projectedEndMonth: 8`, `projectedEndYear: 2026`. Contribution fields are `null`.

### 4. DEBT goal missing installments should fail

```bash
curl -X POST http://localhost:4000/api/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Deuda", "type": "DEBT", "targetAmount": 2500000}'
```

**Expected**: 400, validation error — `plannedInstallments`, `startMonth`, `startYear` are required for DEBT goals.

### 5. Get projection for SAVINGS goal

```bash
curl http://localhost:4000/api/goals/{goalId}/projection \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 200, projection with `historicalMonthlyRate`, `plannedMonthlyRate`, `actualMonthlyRate`, `insightMessages[]`.

### 6. Get projection with no income data

**Expected**: 200, `historicalMonthlyRate: null`, `insightMessages` includes fallback message about registering income transactions.

### 7. Frontend: type switcher changes form fields

1. Open goal creation modal
2. Select "Deuda" → see installments, start month, start year fields
3. Switch to "Ahorro" → installment fields disappear, contribution fields appear
4. Switch back to "Deuda" → contribution fields disappear, installment fields reappear

### 8. Frontend: SAVINGS goal card shows projection

1. Create a SAVINGS goal with target $19,000,000
2. In the goals list, the card should show projected completion info (or fallback message)
3. Open detail modal → see projection insights section with Spanish messages

### 9. Frontend: SAVINGS detail shows pace comparison

1. Create SAVINGS goal with planned contribution $1,000,000/month
2. Link transactions totaling $3,000,000 over 2 months ($1,500,000/month actual)
3. Open detail → see "Vas adelantado!" insight message

### 10. Budget page adapts for SAVINGS goals

1. Have an active SAVINGS goal
2. Navigate to Budgets page
3. "Metas del Mes" section shows the goal with contribution info instead of "cuota sugerida"
