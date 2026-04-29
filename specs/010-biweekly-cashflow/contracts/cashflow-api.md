# API Contract — Biweekly Cashflow

Base path: `/api/cashflow`. JWT Bearer obligatorio. Wrapper estándar `ApiResponse<T>`.

---

## `GET /api/cashflow/biweekly`

Devuelve las transacciones reales del usuario para el mes solicitado, agrupadas en dos quincenas según la configuración (default calendario o personalizado).

### Request

- Headers: `Authorization: Bearer <accessToken>`
- Query:
  - `month` (number, 1–12) — obligatorio.
  - `year` (number, 2000–2100) — obligatorio.

Esquema Zod:

```ts
const biweeklyQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
```

### Response 200

```json
{
  "success": true,
  "data": {
    "month": 5,
    "year": 2026,
    "mode": "custom",
    "buckets": [
      {
        "half": 1,
        "rangeStart": "2026-04-30T00:00:00.000Z",
        "rangeEnd": "2026-05-14T23:59:59.999Z",
        "rangeLabel": "30 abr – 14 may",
        "entries": [
          {
            "id": "tx-1",
            "date": "2026-05-05T00:00:00.000Z",
            "type": "EXPENSE",
            "amount": 200000,
            "description": "Mercado",
            "category": { "id": "...", "name": "Alimentación", "color": "#...", "icon": "shopping-cart" },
            "account": { "id": "...", "name": "Bancolombia" },
            "paymentMethod": "DEBIT_CARD"
          }
        ],
        "totalIncome": 0,
        "totalExpense": 200000,
        "netBalance": -200000
      },
      {
        "half": 2,
        "rangeStart": "2026-05-15T00:00:00.000Z",
        "rangeEnd": "2026-05-29T23:59:59.999Z",
        "rangeLabel": "15 may – 29 may",
        "entries": [],
        "totalIncome": 0,
        "totalExpense": 0,
        "netBalance": 0
      }
    ],
    "monthTotals": {
      "totalIncome": 0,
      "totalExpense": 200000,
      "netBalance": -200000
    }
  },
  "message": "Cashflow calculated"
}
```

Reglas:
- `buckets` siempre tiene exactamente 2 elementos en orden Q1 (half=1), Q2 (half=2).
- `mode` refleja la config del usuario (`calendar` por defecto, `custom` si activado).
- `rangeLabel` está en español; meses abreviados (3 letras minúsculas, "abr", "may", etc.).
- `entries` ordenado ascendente por `date`.
- `totalIncome` y `totalExpense` excluyen `TRANSFER`.
- `monthTotals` = suma de los dos buckets.

### Errores

| Código | Causa |
|--------|-------|
| 401 | Sin auth |
| 422 | Validación Zod (mes/año fuera de rango) |
| 500 | Error inesperado |

---

## Casos cubiertos por tests (backend)

- Default calendar: usuario sin custom, transacciones del 5 y 20 de mayo → 5 en Q1 (1–15), 20 en Q2 (16–31).
- Custom q1<q2 (ej. 5 y 20): tx del día 6 en Q1 (5–19), tx del día 25 en Q2 (20–31).
- Custom q1>q2 (30/15) en mayo 2026:
  - tx 28 abril → Q1.
  - tx 5 mayo → Q1.
  - tx 14 mayo → Q1.
  - tx 15 mayo → Q2.
  - tx 28 mayo → Q2.
  - tx 30 mayo → ninguna (cae en Q1 de junio).
- Custom q1=30, mes febrero (28 días): clamp aplica, no rompe; rango Q1 = "30 ene – 14 feb".
- Mes vacío: buckets con totales en cero.
- Transferencias listadas pero no en totales.
- 401 sin token; 422 con mes inválido.
- Aislamiento por usuario: A no ve datos de B.
