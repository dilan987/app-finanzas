# Requirements Validation Checklist — 006-smart-projections

## Functional Requirements

- [ ] **FR-001**: Historical projection uses net monthly savings (INCOME - EXPENSES, excluding TRANSFERS)
- [ ] **FR-002**: Weighted average applied to net savings (recent 3 months × 2, older 3 months × 1)
- [ ] **FR-003**: Zero/negative net savings shows diagnostic message, no time projection
- [ ] **FR-004**: Available balance = sum(currentBalance) for active accounts with includeInTotal = true
- [ ] **FR-005**: Balance > 0 shows secondary insight with reduced savings needed
- [ ] **FR-006**: Balance covering goal shows encouraging "already within reach" message
- [ ] **FR-007**: Total goal commitments = sum of OTHER active goals' planned monthly contributions
- [ ] **FR-008**: Overcommitment warning when total commitments > net savings
- [ ] **FR-009**: Existing projection features (planned, actual pace, comparison) still work
- [ ] **FR-010**: Label changed from "ingresos promedio" to "ahorro neto promedio"
- [ ] **FR-011**: All messages in Spanish with COP currency formatting

## Success Criteria

- [ ] **SC-001**: $4.66M income / $3.8M expenses → ~23 month projection for $20M goal
- [ ] **SC-002**: Projection message says "ahorro neto"
- [ ] **SC-003**: User with $5M balance sees balance-aware insight
- [ ] **SC-004**: Overcommitted goals show warning
- [ ] **SC-005**: Planned pace, actual pace, comparison unchanged
- [ ] **SC-006**: DEBT goal projections unaffected

## Edge Cases

- [ ] Only 1 month of history → caveat message about limited data
- [ ] Net savings exactly $0 → specific message
- [ ] TRANSFER transactions excluded from calculations
- [ ] Goal with totalPaid > 0 → projects remaining amount
- [ ] Accounts with includeInTotal = false excluded from balance
