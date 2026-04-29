# Data Model — 009-scheduled-movements

## 1. Cambios en la base de datos

### 1.1. Enum `Frequency` — valor adicional

```prisma
enum Frequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  YEARLY
  ONCE       // NUEVO
}
```

### 1.2. Migración

Nombre: `add_frequency_once`. La migración la genera Prisma. SQL ilustrativo:

```sql
ALTER TYPE "Frequency" ADD VALUE 'ONCE';
```

`ALTER TYPE ... ADD VALUE` no requiere reescribir filas existentes — totalmente retrocompatible.

### 1.3. Modelo `RecurringTransaction` — sin cambios estructurales

Sigue siendo el mismo modelo (sin campos nuevos). La interpretación de `frequency = 'ONCE'`:
- `nextExecutionDate` apunta a la fecha exacta en que debe ejecutarse.
- Tras ejecución, el motor pone `isActive = false` y NO actualiza `nextExecutionDate`.

## 2. Reglas de transición y ejecución

| Estado origen | Acción | Estado destino |
|---------------|--------|----------------|
| `frequency=ONCE` & `isActive=true` & `nextExecutionDate <= now` | `processRecurring` ejecuta | crea `Transaction`, ajusta saldo de cuenta, marca `isActive=false`, NO actualiza `nextExecutionDate` |
| `frequency` repetitivo & `isActive=true` & `nextExecutionDate <= now` | `processRecurring` ejecuta | crea `Transaction`, ajusta saldo, actualiza `nextExecutionDate` con `calculateNextExecutionDate(...)`, mantiene `isActive=true` (igual que hoy) |
| `frequency=ONCE` & `isActive=false` | (nada) | permanece inactivo en historial |

## 3. Entidad cliente: `BiweeklyProjection` (vista derivada, no persistida)

Devuelta por `GET /api/recurring/projection`. Estructura:

```ts
type BiweeklyProjectionEntry = {
  id: string;                 // recurringTransactionId
  date: string;               // ISO de la ocurrencia proyectada en este mes
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string | null;
  category: { id: string; name: string; color: string; icon: string } | null;
  account: { id: string; name: string } | null;
  frequency: Frequency;       // incluye 'ONCE'
  isOnce: boolean;
};

type BiweeklyBucket = {
  half: 1 | 2;                // 1 = primera quincena (1–15); 2 = segunda (16–fin)
  startDay: number;
  endDay: number;
  entries: BiweeklyProjectionEntry[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
};

type BiweeklyProjectionResponse = {
  month: number;              // 1–12
  year: number;
  buckets: [BiweeklyBucket, BiweeklyBucket]; // siempre 2: Q1 y Q2
  monthTotals: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
};
```

## 4. Reglas de proyección por movimiento

Para cada movimiento `RecurringTransaction` con `userId = current && isActive = true`:

1. Sea `cursor = nextExecutionDate`.
2. Sea `endOfMonth = último día calendario del mes solicitado, 23:59:59`.
3. Sea `startOfMonth = día 1 a las 00:00:00` (en zona del servidor).
4. Si `cursor > endOfMonth`: el movimiento no aporta ocurrencias para ese mes. Continuar.
5. Si `cursor < startOfMonth`:
   - Si `frequency = ONCE`: NO se incluye en la proyección del mes solicitado. Un `ONCE` atrasado (cuya fecha original cayó en un mes anterior) sigue siendo `isActive=true` y aparecerá en su mes real (donde su fecha calendario cae), no en meses futuros. (Resolución de F1 del análisis.)
   - Si frecuencia repetitiva: avanzar `cursor = calculateNextExecutionDate(cursor, frequency)` repetidamente hasta `cursor >= startOfMonth`.
6. Mientras `cursor <= endOfMonth`:
   - Agregar entrada con la fecha actual de `cursor`.
   - Si `frequency = ONCE`: salir del bucle (solo una ocurrencia).
   - Si frecuencia repetitiva: `cursor = calculateNextExecutionDate(cursor, frequency)`.
7. Asignar cada entrada a su quincena según `cursor.getDate()`:
   - 1 ≤ día ≤ 15 → bucket Q1.
   - 16 ≤ día ≤ último → bucket Q2.

## 5. Reglas de integridad

- El cálculo de proyección NUNCA modifica el estado del movimiento (es de solo lectura).
- Solo se consideran movimientos del propio usuario autenticado.
- Si `frequency = ONCE` y `isActive = false`, el movimiento NO aparece en proyección.
- La proyección no incluye transacciones reales ya ejecutadas (esas se reportan en el resumen actual de Budgets/Analytics).

## 6. Catálogo de constantes (cliente)

`FREQUENCIES` (en `frontend/src/utils/constants.ts`) añade:

```ts
{ value: 'ONCE', label: 'Solo una vez' }
```

El orden recomendado para mostrar en el selector: `ONCE` al final, después de `YEARLY`, para no romper el orden lógico de "frecuencias repetitivas → puntual".
