# Requirements Validation Checklist: Multi-Account System

## Completeness

- [x] All user stories have acceptance scenarios with Given/When/Then format
- [x] Edge cases are identified and documented
- [x] Success criteria are measurable and specific
- [x] Key entities are described with relationships
- [x] Assumptions and scope boundaries are explicit

## Testability

- [x] FR-001: Account CRUD — verifiable via API tests
- [x] FR-002: Account fields — verifiable via schema validation
- [x] FR-003: Account types — verifiable via enum validation
- [x] FR-004: Transaction-account link — verifiable via transaction creation tests
- [x] FR-005: Transfer type — verifiable via transfer creation with balance checks
- [x] FR-006: Real-time balance — verifiable by reading account after transaction
- [x] FR-007: Dashboard account section — verifiable via UI test (no month filter effect)
- [x] FR-008: Net worth calculation — verifiable via API with mixed account types
- [x] FR-009: Budget on-budget scope — verifiable by comparing budget with on/off-budget transactions
- [x] FR-010: Recurring with account — verifiable via recurring execution test
- [x] FR-011: Filter by account — verifiable via transaction list API with accountId parameter
- [x] FR-012: Migration safety — verifiable by checking existing data post-migration
- [x] FR-013: Soft delete — verifiable via archive then query historical data
- [x] FR-014: Account reorder — verifiable via sortOrder update API
- [x] FR-015: Account selector in form — verifiable via UI test
- [x] FR-016: Transfers no category — verifiable via transfer creation without categoryId

## Scope Clarity

- [x] CSV import explicitly excluded from scope
- [x] Bank syncing explicitly excluded from scope
- [x] Cross-currency conversion explicitly excluded from scope
- [x] Investment module independence documented
- [x] Migration strategy documented (nullable accountId, default "General" account)
