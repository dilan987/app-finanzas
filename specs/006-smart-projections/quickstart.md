# Quickstart: 006-smart-projections

## Key Validation Scenarios

### Scenario 1: Net Savings Projection
1. User has 6 months of INCOME ($4,660,000/mo avg) and EXPENSE ($3,800,000/mo avg)
2. Creates a $20,000,000 SAVINGS goal
3. GET /api/goals/:id/projection
4. **Expect**: `netMonthlySavings ≈ 860,000`, `historicalMonthsRemaining ≈ 23`
5. **Expect**: insight message says "ahorro neto promedio de $860.000/mes"

### Scenario 2: Negative Net Savings
1. User has expenses exceeding income (net negative)
2. GET /api/goals/:id/projection
3. **Expect**: `historicalMonthsRemaining = null`, no time projection
4. **Expect**: insight message says "Tu promedio de gastos supera tus ingresos"

### Scenario 3: Balance-Aware Insight
1. User has $5,000,000 across active on-budget accounts
2. Net savings of $860,000/mo, goal target $20,000,000
3. **Expect**: `availableBalance = 5000000`
4. **Expect**: secondary insight about $15,000,000 remaining (~17 months)

### Scenario 4: Balance Covers Goal
1. User accounts sum to $25,000,000, goal target is $20,000,000
2. **Expect**: insight says "Tu saldo actual ya cubre esta meta"

### Scenario 5: Overcommitment Warning
1. User has net savings $860,000/mo
2. Two other active goals with total commitments $1,000,000/mo
3. **Expect**: `isOvercommitted = true`
4. **Expect**: warning about commitments exceeding net savings

### Scenario 6: Limited Data Caveat
1. User has only 1 month of transaction history
2. **Expect**: `monthsOfData = 1`
3. **Expect**: caveat message about limited data accuracy

### Scenario 7: DEBT Goal Unchanged
1. DEBT goal projection
2. **Expect**: `netMonthlySavings = null`, `availableBalance = 0`, no new insight messages
3. **Expect**: existing DEBT projection behavior preserved
