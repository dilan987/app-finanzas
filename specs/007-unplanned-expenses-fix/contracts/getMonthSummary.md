# Contract: getMonthSummary — unplannedExpenses field

## Endpoint

`GET /api/budgets/summary?month={month}&year={year}`

## Response Field Change

### `unplannedExpenses` (Number)

**Before**: Sum of all EXPENSE transactions in categories that have NO budget at all.

**After**: Sum of:
1. For each EXPENSE budget with a categoryId: `max(0, actualAmount - budgetAmount)`
2. All EXPENSE transactions in categories with no budget
3. All EXPENSE transactions with null categoryId

### Response shape (unchanged)

```json
{
  "success": true,
  "data": {
    "month": 4,
    "year": 2026,
    "totalProjectedIncome": 4600000,
    "totalProjectedExpenses": 3497000,
    "totalActualIncome": 4960000,
    "totalActualExpenses": 3103086,
    "projectedBalance": 1103000,
    "actualBalance": 1856914,
    "unplannedExpenses": 106900,
    "budgets": [...],
    "goals": [...]
  }
}
```

## Behavioral Contract

| Scenario | Expected `unplannedExpenses` |
|----------|------------------------------|
| Budget $200k for "Transporte", actual $350k | Includes $150k from Transporte |
| Budget $200k for "Transporte", actual $100k | Includes $0 from Transporte |
| No budget for "Otros", actual $90k | Includes $90k from Otros |
| No budgets exist at all | Equals totalActualExpenses |
| Expense with null categoryId, $50k | Includes $50k |
| TRANSFER type transaction | Excluded always |
| Off-budget account expense | Excluded always |
