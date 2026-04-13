# Tasks: Multi-Account System

**Input**: Design documents from `/specs/003-multi-account/`
**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Database Schema

- [ ] T001 [US1] Add AccountType enum and Account model to `backend/prisma/schema.prisma`
- [ ] T002 [US2] Add TRANSFER to TransactionType enum, add accountId + transferAccountId to Transaction model
- [ ] T003 [US6] Add accountId to RecurringTransaction model
- [ ] T004 Run prisma migration and generate client

**Checkpoint**: Database schema ready

---

## Phase 2: Backend Accounts Module

- [ ] T005 [US1] Create `backend/src/modules/accounts/accounts.schema.ts` — Zod schemas for create, update, query
- [ ] T006 [US1] Create `backend/src/modules/accounts/accounts.service.ts` — CRUD + getSummary (balances, net worth)
- [ ] T007 [US1] Create `backend/src/modules/accounts/accounts.controller.ts`
- [ ] T008 [US1] Create `backend/src/modules/accounts/accounts.routes.ts`
- [ ] T009 [US1] Register accounts routes in `backend/src/app.ts`

**Checkpoint**: Account CRUD API functional

---

## Phase 3: Transaction-Account Integration

- [ ] T010 [US2] Modify `backend/src/modules/transactions/transactions.schema.ts` — add accountId, transferAccountId, TRANSFER type
- [ ] T011 [US2] Modify `backend/src/modules/transactions/transactions.service.ts` — balance updates on create/update/delete
- [ ] T012 [US3] Add transfer logic to transactions service — atomic dual-balance updates
- [ ] T013 [US2] Add accountId filter to transaction queries
- [ ] T014 [US5] Modify `backend/src/modules/budgets/budgets.service.ts` — scope to on-budget accounts

**Checkpoint**: Transactions update account balances, transfers work, budgets scoped

---

## Phase 4: Recurring Transactions + Analytics

- [ ] T015 [US6] Modify `backend/src/modules/recurring/recurring.schema.ts` — add accountId
- [ ] T016 [US6] Modify `backend/src/modules/recurring/recurring.service.ts` — pass accountId to generated transactions, update balance

**Checkpoint**: Recurring transactions account-aware

---

## Phase 5: Frontend Foundation

- [ ] T017 [P] [US1] Add Account types and DTOs to `frontend/src/types/index.ts`
- [ ] T018 [P] [US1] Create `frontend/src/api/accounts.api.ts`
- [ ] T019 [P] [US1] Create `frontend/src/store/accountStore.ts`

**Checkpoint**: Frontend data layer ready

---

## Phase 6: Frontend Account UI

- [ ] T020 [US1] Create `frontend/src/components/accounts/AccountCard.tsx`
- [ ] T021 [US1] Create `frontend/src/components/accounts/AccountForm.tsx`
- [ ] T022 [US1] Create `frontend/src/components/accounts/AccountList.tsx`
- [ ] T023 [US1] Create `frontend/src/pages/AccountsPage.tsx`
- [ ] T024 [US1] Add /accounts route to `frontend/src/routes/AppRoutes.tsx`
- [ ] T025 [US1] Add Accounts item to `frontend/src/components/layout/Sidebar.tsx`

**Checkpoint**: Account management page functional

---

## Phase 7: Dashboard Hybrid View

- [ ] T026 [US4] Create `frontend/src/components/accounts/AccountsSummaryPanel.tsx` — always-visible accounts + net worth
- [ ] T027 [US4] Modify `frontend/src/pages/dashboard/DashboardPage.tsx` — integrate AccountsSummaryPanel above monthly data

**Checkpoint**: Dashboard shows hybrid view

---

## Phase 8: Transaction + Recurring Form Updates

- [ ] T028 [US2] Update transaction create/edit forms with account selector
- [ ] T029 [US3] Add transfer form to transactions page
- [ ] T030 [US2] Add account filter to transactions list
- [ ] T031 [US6] Update recurring transaction forms with account selector

**Checkpoint**: All forms account-aware

---

## Dependencies & Execution Order

- **Phase 1** (Schema): No dependencies — BLOCKS everything
- **Phase 2** (Accounts Module): Depends on Phase 1
- **Phase 3** (Transaction Integration): Depends on Phase 2
- **Phase 4** (Recurring + Analytics): Depends on Phase 3
- **Phase 5** (Frontend Foundation): Depends on Phase 2 (API must exist)
- **Phase 6** (Account UI): Depends on Phase 5
- **Phase 7** (Dashboard): Depends on Phase 5 + Phase 6
- **Phase 8** (Form Updates): Depends on Phase 5 + Phase 3
