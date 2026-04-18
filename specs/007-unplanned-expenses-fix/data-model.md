# Data Model: 007-unplanned-expenses-fix

## No Schema Changes Required

This feature modifies only a derived calculation. No new models, fields, or migrations are needed.

## Existing Entities Used

### Budget (read-only)
| Field | Type | Relevance |
|-------|------|-----------|
| type | INCOME / EXPENSE | Filter to EXPENSE budgets only |
| categoryId | String? | Links budget to a spending category |
| amount | Decimal | The planned/budgeted amount |
| month | Int | Scoping to target month |
| year | Int | Scoping to target year |

### Transaction (read-only, aggregated)
| Field | Type | Relevance |
|-------|------|-----------|
| type | INCOME / EXPENSE / TRANSFER | Filter to EXPENSE only |
| categoryId | String? | Match against budget categories |
| amount | Decimal | Actual spending amount |
| date | DateTime | Scoping to target month |
| accountId | String? | On-budget filtering |

## Derived Metric: Unplanned Expenses

**Formula**:
```
unplannedExpenses =
  Σ max(0, actualSpending[cat] - budgetAmount[cat])   // for each budgeted category
  + Σ expenses in categories with no budget            // fully unbudgeted
  + Σ expenses with null categoryId                    // uncategorized
```

**Constraints**:
- Only `type = EXPENSE` transactions
- Only on-budget accounts (existing `onBudgetFilter`)
- `TRANSFER` type excluded
- Off-budget accounts excluded
