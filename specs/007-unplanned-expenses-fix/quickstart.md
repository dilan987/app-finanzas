# Quickstart Validation: 007-unplanned-expenses-fix

## Key Validation Scenarios

### 1. Excess over budget counts as unplanned

**Setup**: Budget "Alimentacion" = $200,000. Three expenses in "Alimentacion" totaling $350,000.

**Expected**: `unplannedExpenses` includes $150,000 from this category.

**Verify**: `GET /api/budgets/summary?month=4&year=2026` → `unplannedExpenses >= 150000`

### 2. Within-budget spending is NOT unplanned

**Setup**: Budget "Transporte" = $500,000. Expenses in "Transporte" = $300,000.

**Expected**: $0 unplanned from "Transporte".

### 3. Unbudgeted category is fully unplanned

**Setup**: No budget for "Otros". Expense $90,000 in "Otros".

**Expected**: `unplannedExpenses` includes the full $90,000.

### 4. Mixed scenario

**Setup**:
- Budget "Alimentacion" $200k, actual $250k → excess $50k
- Budget "Transporte" $100k, actual $80k → excess $0
- No budget "Otros", actual $30k → fully unplanned $30k

**Expected**: `unplannedExpenses = 80,000` ($50k + $0 + $30k)

### 5. No budgets at all

**Setup**: Delete all budgets for the month. Some expenses exist.

**Expected**: `unplannedExpenses = totalActualExpenses`

### 6. Null category expense

**Setup**: Expense with no category assigned, amount $15,000.

**Expected**: Included in `unplannedExpenses`.

## Quick Manual Test

```bash
# After applying the fix, restart backend and call:
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/budgets/summary?month=4&year=2026" | jq '.data.unplannedExpenses'
```
