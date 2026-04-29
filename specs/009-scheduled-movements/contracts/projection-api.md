# API Contract — Recurring Projection (Quincena)

Base path: `/api/recurring`. JWT Bearer obligatorio. Wrapper estándar `ApiResponse<T>`.

---

## 1. `GET /api/recurring/projection`

Devuelve la proyección de cash flow del mes solicitado, agrupada por quincena, basada en los movimientos programados activos del usuario.

### Request

- Headers: `Authorization: Bearer <accessToken>`
- Query:
  - `month` (number, 1–12) — obligatorio.
  - `year` (number, 2000–2100) — obligatorio.

Esquema Zod:

```ts
const projectionQuerySchema = z.object({
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
    "buckets": [
      {
        "half": 1,
        "startDay": 1,
        "endDay": 15,
        "entries": [
          {
            "id": "uuid-1",
            "date": "2026-05-05T00:00:00.000Z",
            "type": "EXPENSE",
            "amount": 1500000,
            "description": "Arriendo",
            "category": { "id": "cat-1", "name": "Vivienda", "color": "#...", "icon": "home" },
            "account": { "id": "acc-1", "name": "Banco" },
            "frequency": "MONTHLY",
            "isOnce": false
          }
        ],
        "totalIncome": 0,
        "totalExpense": 1500000,
        "netBalance": -1500000
      },
      {
        "half": 2,
        "startDay": 16,
        "endDay": 31,
        "entries": [],
        "totalIncome": 0,
        "totalExpense": 0,
        "netBalance": 0
      }
    ],
    "monthTotals": {
      "totalIncome": 0,
      "totalExpense": 1500000,
      "netBalance": -1500000
    }
  },
  "message": "Projection calculated"
}
```

Reglas:
- `buckets` siempre tiene exactamente 2 elementos en orden Q1 (half=1), Q2 (half=2).
- `endDay` del bucket Q2 refleja el último día calendario real del mes consultado.
- `entries` está ordenado por `date` ascendente.
- `monthTotals` = suma de los dos buckets.

### Errores

| Código | Causa |
|--------|-------|
| 401 | Sin autenticación |
| 422 | Validación Zod (mes/año fuera de rango) |
| 500 | Error inesperado |

---

## 2. Cambios en endpoints existentes

Los endpoints del módulo `recurring` aceptan `'ONCE'` en el campo `frequency` (creación, actualización). El esquema Zod se actualiza:

```ts
frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY', 'ONCE'])
```

`processRecurring` (existente, no expuesto vía endpoint público) se actualiza para reconocer `ONCE` y desactivar el movimiento en lugar de calcular `nextExecutionDate`.

## 3. Casos cubiertos por tests (backend)

- `GET /projection` con mes vacío → buckets con totales en cero, sin error.
- `GET /projection` con un movimiento `MONTHLY` cuyo día cae en Q1 → aparece en bucket 1.
- `GET /projection` con uno cuyo día cae en Q2 → aparece en bucket 2.
- `GET /projection` con un movimiento `ONCE` activo en el mes → aparece una sola vez.
- `GET /projection` con un movimiento `ONCE` inactivo (ejecutado) → NO aparece.
- `GET /projection` con un movimiento `WEEKLY` cuya `nextExecutionDate` cae el día 1 → genera 4–5 ocurrencias en el mes correctamente distribuidas entre Q1 y Q2.
- `GET /projection` con un movimiento `BIWEEKLY` cuya fecha cae en Q1 → genera 1–2 ocurrencias en el mes.
- POST `/api/recurring` con `frequency: ONCE` y fecha válida → 201, persistido.
- `processRecurring` ejecuta un `ONCE`: tras ejecución → `isActive=false`, `nextExecutionDate` no cambia, transacción real creada y saldo de cuenta ajustado.
- `processRecurring` ejecuta un `MONTHLY`: comportamiento intacto (regresión).
- Aislamiento por usuario: usuario A no ve proyecciones de usuario B.
- Sin token → 401 en `/projection`.
