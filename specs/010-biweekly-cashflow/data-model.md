# Data Model — 010-biweekly-cashflow

## 1. Cambios en la base de datos

### 1.1. Modelo `User` — columnas añadidas

```prisma
model User {
  // ... existentes
  biweeklyCustomEnabled Boolean @default(false)
  biweeklyStartDay1     Int?
  biweeklyStartDay2     Int?
  // ...
}
```

| Columna | Tipo | Default | Nullable | Descripción |
|---------|------|---------|----------|-------------|
| `biweeklyCustomEnabled` | `Boolean` | `false` | NO | Activa el modo personalizado. Si `false`, el sistema usa Q1=1, Q2=16. |
| `biweeklyStartDay1` | `Int` | `null` | SÍ | Día de inicio de la primera quincena (1–31). Solo se usa si `biweeklyCustomEnabled=true`. |
| `biweeklyStartDay2` | `Int` | `null` | SÍ | Día de inicio de la segunda quincena (1–31). Solo se usa si `biweeklyCustomEnabled=true`. |

### 1.2. Migración

Nombre: `add_biweekly_config`. La genera Prisma con `prisma db push` o `migrate dev`. SQL ilustrativo:

```sql
ALTER TABLE "User"
  ADD COLUMN "biweeklyCustomEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "biweeklyStartDay1" INTEGER,
  ADD COLUMN "biweeklyStartDay2" INTEGER;
```

Sin reescritura de filas existentes.

## 2. Reglas de validación (backend)

Al actualizar profile (PUT `/api/users/profile`), validación Zod refinada:

```ts
const profileSchema = z.object({
  // ... campos existentes
  biweeklyCustomEnabled: z.boolean().optional(),
  biweeklyStartDay1: z.number().int().min(1).max(31).nullable().optional(),
  biweeklyStartDay2: z.number().int().min(1).max(31).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.biweeklyCustomEnabled === true) {
    if (data.biweeklyStartDay1 == null || data.biweeklyStartDay2 == null) {
      ctx.addIssue({ code: 'custom', message: 'Both day1 and day2 are required when custom is enabled', path: ['biweeklyStartDay1'] });
    } else if (data.biweeklyStartDay1 === data.biweeklyStartDay2) {
      ctx.addIssue({ code: 'custom', message: 'day1 and day2 must be different', path: ['biweeklyStartDay2'] });
    }
  }
});
```

Cuando `biweeklyCustomEnabled` se setea a `false`, los días pueden mantenerse o limpiarse; el código de cálculo siempre usa 1/16 si custom está deshabilitado.

## 3. Entidad cliente: `User` extendida

```ts
interface User {
  // existentes
  biweeklyCustomEnabled: boolean;
  biweeklyStartDay1: number | null;
  biweeklyStartDay2: number | null;
}
```

## 4. Entidad cliente: `BiweeklyCashflow` (vista derivada, no persistida)

```ts
type BiweeklyCashflowEntry = {
  id: string;                    // Transaction.id
  date: string;                  // ISO de la transacción
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  currency: string;              // Currency de la Transaction (heredada)
  description: string | null;
  category: { id: string; name: string; color: string; icon: string } | null;
  account: { id: string; name: string } | null;
  paymentMethod: 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER';
};

// Nota: los totales agregan todas las monedas asumiendo la moneda principal
// del usuario (mismo comportamiento que los demás endpoints del proyecto).
// Multi-currency reporting es out-of-scope de v1.

type BiweeklyCashflowBucket = {
  half: 1 | 2;
  rangeStart: string;            // ISO date
  rangeEnd: string;              // ISO date
  rangeLabel: string;            // "30 abr – 14 may"
  entries: BiweeklyCashflowEntry[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
};

type BiweeklyCashflowResponse = {
  month: number;                 // 1–12
  year: number;
  mode: 'calendar' | 'custom';
  buckets: [BiweeklyCashflowBucket, BiweeklyCashflowBucket];
  monthTotals: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
};
```

## 5. Helper `computeBiweeklyRanges`

Vive en `backend/src/utils/biweekly.ts` y `frontend/src/utils/biweekly.ts` (espejo).

```ts
export interface BiweeklyRange {
  start: Date;     // UTC midnight, inclusive
  end: Date;       // UTC end-of-day, inclusive
  label: string;   // "30 abr – 14 may" en español
}

export interface BiweeklyRanges {
  q1: BiweeklyRange;
  q2: BiweeklyRange;
}

export function computeBiweeklyRanges(
  month: number,        // 1-12
  year: number,
  mode: 'calendar' | 'custom',
  day1: number | null,
  day2: number | null,
): BiweeklyRanges
```

Reglas:
- Si `mode='calendar'` o cualquier día es null: q1 = días 1..15 del mes; q2 = días 16..lastDay del mes.
- Si `mode='custom'` y `day1 < day2`: q1 = días day1..(day2-1); q2 = días day2..lastDay.
- Si `mode='custom'` y `day1 > day2`:
  - q1 = (mes anterior, día clamp(day1, prev)) hasta (mes actual, día day2-1).
  - q2 = (mes actual, día day2) hasta (mes actual, día clamp(day1-1, current)).
- `clamp(day, year, month) = Math.min(day, lastDay(year, month))`.
- `day1 == day2` no debe ocurrir (validado en backend); si llega, el helper degrada a calendar.

## 6. Reglas de cálculo de la respuesta del endpoint

1. Resolver el modo y los días del usuario autenticado leyendo de `User`.
2. Llamar `computeBiweeklyRanges(month, year, mode, day1, day2)`.
3. Para cada bucket, query a Prisma:
   ```ts
   prisma.transaction.findMany({
     where: { userId, date: { gte: range.start, lte: range.end } },
     include: { category: true, account: { select: { id: true, name: true } } },
     orderBy: { date: 'asc' },
   })
   ```
4. Agregar totales: ingresos = suma `INCOME`, gastos = suma `EXPENSE`, neto = ingresos - gastos. `TRANSFER` se incluye en `entries` pero no en totales.
5. `monthTotals` = suma de los dos buckets.
6. Devolver el shape descrito.

## 7. Reglas de integridad

- El cálculo es de solo lectura.
- Solo se consideran transacciones del propio usuario autenticado.
- El `mode` retornado refleja la config actual del usuario, así el frontend puede mostrar el badge correcto.
- Las transferencias nunca alteran totales agregados.
