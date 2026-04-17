# Requirements Validation Checklist: Financial Goals (Metas de Pago)

**Feature**: 004-financial-goals  
**Created**: 2026-04-15  
**Status**: Pending Review

## Spec Completeness

- [x] All user stories have acceptance scenarios with Given/When/Then format
- [x] Priority levels assigned to all user stories (P1/P2)
- [x] Edge cases identified and documented
- [x] Key entities defined with relationships
- [x] Success criteria are measurable
- [x] Assumptions documented

## Functional Requirements Traceability

| Requirement | User Story | Testable | Clear |
|-------------|-----------|----------|-------|
| FR-001: Goal creation with required fields | US-1 | Yes | Yes |
| FR-002: Auto-calculate installment amount | US-1 | Yes | Yes |
| FR-003: Auto-calculate projected end date | US-1 | Yes | Yes |
| FR-004: Link transactions to goals | US-2 | Yes | Yes |
| FR-005: Recalculate progress on transaction changes | US-2 | Yes | Yes |
| FR-006: Show goals in budget projection | US-3 | Yes | Yes |
| FR-007: Total monthly commitment in projection | US-3 | Yes | Yes |
| FR-008: Dedicated goals page | US-5 | Yes | Yes |
| FR-009: Edit goal (name, description, installments) | US-4 | Yes | Yes |
| FR-010: Auto-complete goal at 100% | US-4 | Yes | Yes |
| FR-011: Cancel goal without affecting transactions | US-4 | Yes | Yes |
| FR-012: Goal detail view with linked transactions | US-5 | Yes | Yes |
| FR-013: User-scoped data | All | Yes | Yes |
| FR-014: Goal type determines linkable tx types | US-2 | Yes | Yes |

## Risk Assessment

- [ ] **Data integrity**: Goal progress must stay in sync with linked transactions — verify on tx create/edit/delete
- [ ] **Performance**: Goals in projection view add queries per month — monitor query count
- [ ] **UX clarity**: User must understand that linking a tx is optional, not required
- [ ] **Edge case**: Overpayment handling needs clear visual indication

## Open Questions

- None critical. Feature is well-scoped for v1.
