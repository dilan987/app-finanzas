# API Contract: Goals V2

**Feature**: `005-goals-v2-enhancement` | **Date**: 2026-04-16

## Modified Endpoints

### POST /api/goals — Create Goal

**Change**: Request body becomes a discriminated union based on `type`.

#### DEBT variant (unchanged behavior)

```json
{
  "name": "Pagar tarjeta",
  "description": "Deuda tarjeta de credito",
  "type": "DEBT",
  "targetAmount": 2500000,
  "plannedInstallments": 5,
  "startMonth": 4,
  "startYear": 2026
}
```

#### SAVINGS variant (new)

```json
{
  "name": "Moto nueva",
  "description": "Ahorro para moto Yamaha",
  "type": "SAVINGS",
  "targetAmount": 19000000,
  "contributionFrequency": "MONTHLY",
  "plannedContribution": 1000000
}
```

- `contributionFrequency` and `plannedContribution` are both optional
- If one is provided, both should be provided (validated by schema)

#### Response (both types) — 201

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Moto nueva",
    "description": "Ahorro para moto Yamaha",
    "type": "SAVINGS",
    "status": "ACTIVE",
    "targetAmount": 19000000,
    "plannedInstallments": null,
    "suggestedInstallment": null,
    "startMonth": null,
    "startYear": null,
    "projectedEndMonth": null,
    "projectedEndYear": null,
    "contributionFrequency": "MONTHLY",
    "plannedContribution": 1000000,
    "totalPaid": 0,
    "progress": 0,
    "userId": "uuid",
    "createdAt": "2026-04-16T...",
    "updatedAt": "2026-04-16T..."
  },
  "message": "Goal created successfully"
}
```

### PUT /api/goals/:id — Update Goal

**Change**: Update fields depend on goal type.

#### DEBT update

```json
{
  "name": "Updated name",
  "description": "Updated desc",
  "plannedInstallments": 6
}
```

#### SAVINGS update

```json
{
  "name": "Updated name",
  "description": "Updated desc",
  "contributionFrequency": "BIWEEKLY",
  "plannedContribution": 500000
}
```

### GET /api/goals — List Goals

**Change**: Response includes new nullable fields for all goals.

Each goal in `data[]` now has:
- `contributionFrequency: string | null`
- `plannedContribution: number | null`
- Existing installment fields may be `null` for SAVINGS goals

### GET /api/goals/:id — Get Goal Detail

**Change**: Same as list — includes new nullable fields.

---

## New Endpoint

### GET /api/goals/:id/projection — Get Goal Projection

**Auth**: Required (JWT)  
**Params**: `id` — Goal UUID  

Returns computed projection data for a goal. Most useful for SAVINGS goals but works for any goal type.

#### Response — 200

```json
{
  "success": true,
  "data": {
    "goalId": "uuid",
    "goalType": "SAVINGS",
    "historicalMonthlyRate": 2500000,
    "historicalMonthsRemaining": 7,
    "historicalCompletionDate": "2026-11-16",
    "plannedMonthlyRate": 1000000,
    "plannedMonthsRemaining": 19,
    "plannedCompletionDate": "2027-11-16",
    "actualMonthlyRate": 1500000,
    "actualMonthsRemaining": 11,
    "actualCompletionDate": "2027-03-16",
    "paceStatus": "ahead",
    "insightMessages": [
      "Segun tus ingresos promedio de $2,500,000/mes, podrias alcanzar esta meta en aproximadamente 7 meses.",
      "A tu ritmo planificado de $1,000,000/mes, completaras esta meta en 19 meses.",
      "Vas adelantado! Tu ritmo actual ($1,500,000/mes) supera tu plan ($1,000,000/mes)."
    ]
  },
  "message": "Goal projection retrieved successfully"
}
```

#### Response when no data — 200

```json
{
  "success": true,
  "data": {
    "goalId": "uuid",
    "goalType": "SAVINGS",
    "historicalMonthlyRate": null,
    "historicalMonthsRemaining": null,
    "historicalCompletionDate": null,
    "plannedMonthlyRate": null,
    "plannedMonthsRemaining": null,
    "plannedCompletionDate": null,
    "actualMonthlyRate": null,
    "actualMonthsRemaining": null,
    "actualCompletionDate": null,
    "paceStatus": "no_data",
    "insightMessages": [
      "Define un aporte planificado o registra transacciones de ingreso para ver proyecciones."
    ]
  },
  "message": "Goal projection retrieved successfully"
}
```

### GET /api/goals/active-for-month — Active Goals for Month

**Change**: SAVINGS goals (which have no start/end month) are always included as active. Response includes new fields:
- `contributionFrequency: string | null`
- `plannedContribution: number | null`
- `suggestedInstallment` may be `null` for SAVINGS goals
