# API Contract: Goal Projection (Enhanced)

## GET /api/goals/:id/projection

**No changes to endpoint URL, method, or auth requirements.**

### Response (enhanced)

```json
{
  "success": true,
  "data": {
    "goalId": "uuid",
    "goalType": "SAVINGS",
    "historicalMonthlyRate": 860000,
    "historicalMonthsRemaining": 23,
    "historicalCompletionDate": "2028-03-16",
    "plannedMonthlyRate": 500000,
    "plannedMonthsRemaining": 40,
    "plannedCompletionDate": "2029-08-16",
    "actualMonthlyRate": null,
    "actualMonthsRemaining": null,
    "actualCompletionDate": null,
    "paceStatus": "no_data",
    "insightMessages": [
      "Segun tu ahorro neto promedio de $860.000/mes (ingresos - gastos), podrias alcanzar esta meta en aproximadamente 23 meses.",
      "Con tu saldo disponible de $5.000.000, necesitarias ahorrar $15.000.000 adicionales (~17 meses a tu ritmo actual).",
      "A tu ritmo planificado de $500.000/mes, completaras esta meta en 40 meses."
    ],
    "netMonthlySavings": 860000,
    "availableBalance": 5000000,
    "totalGoalCommitments": 500000,
    "isOvercommitted": false,
    "monthsOfData": 6
  },
  "message": "Projection retrieved successfully"
}
```

### New Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `netMonthlySavings` | `number \| null` | Weighted avg of (income - expenses) per month, null if no data |
| `availableBalance` | `number` | Sum of currentBalance across active on-budget accounts |
| `totalGoalCommitments` | `number` | Sum of other active goals' monthly rates |
| `isOvercommitted` | `boolean` | True when totalGoalCommitments > netMonthlySavings |
| `monthsOfData` | `number` | Number of months with transaction data used in calculation |

### Backward Compatibility

- `historicalMonthlyRate` field is preserved but now represents **net savings** instead of raw income
- All existing fields remain in the response
- New fields are additive — frontend can use them or ignore them
