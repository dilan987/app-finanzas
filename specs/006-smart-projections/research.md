# Research: 006-smart-projections

## R1: Net Savings Calculation Approach

**Decision**: Compute net savings per month by querying INCOME and EXPENSE transactions together, grouped by month, then subtract expense totals from income totals per month.

**Rationale**: This gives true month-by-month net savings that can be weighted-averaged. Using two separate aggregate queries (one for income, one for expense) would require an additional groupBy step. A single `findMany` with `type: { in: ['INCOME', 'EXPENSE'] }` is more efficient — one DB round trip, then in-memory grouping.

**Alternatives Rejected**:
- Separate aggregate queries per type: More DB calls, harder to align by month
- Raw SQL with GROUP BY month: Constitution says no raw SQL unless justified; Prisma's findMany + in-memory grouping is sufficient for 6 months of data

## R2: Transfer Exclusion

**Decision**: Exclude `TRANSFER` type transactions from net savings calculation using `type: { in: ['INCOME', 'EXPENSE'] }`.

**Rationale**: Transfers move money between accounts but don't represent income or spending. Including them would double-count (expense from source + income to destination). The TransactionType enum already distinguishes TRANSFER.

## R3: Available Balance Query

**Decision**: Use `prisma.account.aggregate` with `_sum: { currentBalance: true }` filtered by `isActive: true, includeInTotal: true`.

**Rationale**: The Account model already has `isActive` and `includeInTotal` flags that users configure. The `currentBalance` field is maintained by the transaction system. No new fields needed.

## R4: Goal Commitment Aggregation

**Decision**: Query all active goals except the current one, compute monthly rates in application code.

**Rationale**: DEBT goals use `suggestedInstallment` (already monthly). SAVINGS goals use `plannedContribution * frequencyMultiplier`. These are different computation paths so application-level aggregation is cleaner than trying to do it in SQL.

## R5: Months of Data Caveat

**Decision**: Return `monthsOfData` count in the projection response. If <= 1, add a caveat message.

**Rationale**: Weighted average with 1 month of data is unreliable. User should know the projection improves over time. The spec explicitly requires this caveat.
