# Requirements Validation Checklist — 007-unplanned-expenses-fix

## Functional Requirements

- [ ] **FR-001**: Unplanned = sum of (excess over budget per category) + (all expenses in unbudgeted categories)
- [ ] **FR-002**: Within-budget expenses are NOT counted as unplanned
- [ ] **FR-003**: TRANSFER transactions excluded from unplanned calculation
- [ ] **FR-004**: Off-budget account transactions excluded from calculation
- [ ] **FR-005**: Null-category expenses count as unplanned
- [ ] **FR-006**: No frontend changes required — backend-only fix

## Acceptance Scenarios

- [ ] Overspending $150k on a $200k budget → $0 unplanned from that category
- [ ] Overspending $350k on a $200k budget → $150k unplanned from that category
- [ ] Expense in category with no budget → full amount is unplanned
- [ ] No budgets at all → all expenses are unplanned
- [ ] Multiple categories: mix of over-budget and under-budget → only excess sums

## Edge Cases

- [ ] Budget with null categoryId does not affect unplanned calculation
- [ ] Transaction with null categoryId counts as unplanned
- [ ] Off-budget account expenses excluded even if category has no budget
- [ ] TRANSFER type never counted regardless of category

## Regression

- [ ] Existing backend tests pass
- [ ] "Ingreso real", "Gasto real", "Balance Real" values unaffected
- [ ] Projected values (Ingresos Proyectados, Gastos Proyectados, Balance Proyectado) unaffected
