# Implementation Plan: Multi-Account System

**Branch**: `003-multi-account` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)

## Summary

Add a multi-account system allowing users to track finances across multiple bank accounts, credit cards, neobanks, and wallets. Transactions link to accounts, transfers move money between accounts, balances update in real-time, and the dashboard shows a hybrid view (always-visible accounts + month-filtered budgets).

## Technical Context

**Language/Version**: TypeScript 6  
**Primary Dependencies**: Express.js 5, React 19, Prisma 6, Zod 4, Zustand, Tailwind CSS 4  
**Storage**: PostgreSQL 16  
**Testing**: Jest 30 + Supertest (backend), Vitest 4 + RTL (frontend)  
**Target Platform**: Web (Docker)  
**Project Type**: web-service + SPA  
**Constraints**: Zero data loss — existing transactions must be preserved. Nullable accountId for backward compatibility.

## Constitution Check

- [x] Module pattern: New `accounts` module follows controller/service/schema/routes/tests pattern
- [x] Type safety: All new entities have Zod schemas + TypeScript interfaces
- [x] Validation at boundaries: Account and transfer inputs validated with Zod
- [x] Security: All account routes behind authMiddleware, user-scoped data
- [x] Test coverage: Account module will have test file

## Project Structure

### New Files

```text
backend/src/modules/accounts/
├── accounts.controller.ts
├── accounts.service.ts
├── accounts.schema.ts
├── accounts.routes.ts
└── accounts.test.ts

frontend/src/
├── api/accounts.api.ts
├── store/accountStore.ts
├── pages/AccountsPage.tsx
└── components/accounts/
    ├── AccountCard.tsx
    ├── AccountForm.tsx
    ├── AccountList.tsx
    └── AccountsSummaryPanel.tsx
```

### Modified Files

```text
backend/
├── prisma/schema.prisma              # Add Account model, AccountType enum, modify Transaction/RecurringTransaction
├── src/app.ts                         # Register accounts routes
├── src/modules/transactions/
│   ├── transactions.schema.ts         # Add accountId, transferAccountId, TRANSFER type
│   ├── transactions.service.ts        # Balance updates on create/update/delete, transfer logic
│   └── transactions.controller.ts     # Handle transfer creation
├── src/modules/budgets/
│   └── budgets.service.ts             # Filter by on-budget accounts
├── src/modules/recurring/
│   ├── recurring.schema.ts            # Add accountId
│   └── recurring.service.ts           # Pass accountId to generated transactions
├── src/modules/analytics/
│   └── analytics.service.ts           # Account-aware recommendations

frontend/
├── src/types/index.ts                 # Account types, modified Transaction/Recurring types
├── src/store/transactionStore.ts      # Account filter support
├── src/routes/AppRoutes.tsx           # Add /accounts route
├── src/components/layout/Sidebar.tsx  # Add Accounts nav item
├── src/pages/dashboard/DashboardPage.tsx  # Hybrid view with accounts panel
├── src/pages/TransactionsPage.tsx     # Account filter, transfer form
├── src/pages/RecurringPage.tsx        # Account selector
```

## Key Design Decisions

### 1. Balance Strategy: Denormalized + Atomic Updates
Store `currentBalance` on Account. Update it in the same `prisma.$transaction` as the Transaction CRUD. This avoids expensive aggregations on every read.

### 2. Transfers: Single Record with Source + Destination
One Transaction record with `type: TRANSFER`, `accountId` (source), `transferAccountId` (destination). Simpler than paired transactions. Both account balances update atomically.

### 3. Migration: Nullable accountId
`accountId` is nullable on Transaction and RecurringTransaction. Existing data stays untouched. No default "General" account is auto-created — the user can optionally assign accounts to old transactions.

### 4. Budget Scoping: On-Budget Filter
Budget queries add `account.includeInBudget = true` filter. Transactions with null accountId are treated as on-budget (backward compatible).

### 5. Transfer Transactions: Category Optional
TRANSFER type transactions have `categoryId` as nullable (transfers don't need categories). Existing INCOME/EXPENSE transactions still require a category.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Denormalized balance | O(1) reads on dashboard vs O(n) aggregation per account | Computed balance would be too slow for frequent dashboard loads |
| Nullable accountId | Backward compatibility with existing data | Required field would break all existing transactions |
