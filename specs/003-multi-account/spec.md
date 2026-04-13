# Feature Specification: Multi-Account System

**Feature Branch**: `003-multi-account`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "Add a full multi-account management system to the personal finance app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Creation & Management (Priority: P1)

As a user, I want to register my financial accounts (bank accounts, credit cards, neobanks, cash wallets) so that I know exactly where my money is at all times.

When I open the app for the first time after the update, I see a prompt to set up my accounts. I can add "Bancolombia Ahorros", "Nequi", "Visa Platinum", and "Efectivo" as separate accounts. Each account has a type (checking, savings, credit card, neobank, cash), an initial balance, a currency, and a color/icon for easy identification. I can reorder, edit, archive, or delete my accounts at any time.

**Why this priority**: This is the foundation — nothing else works without accounts existing first.

**Independent Test**: Create multiple accounts of different types and verify they appear in the account list with correct balances, types, and visual identifiers.

**Acceptance Scenarios**:

1. **Given** I am an authenticated user, **When** I navigate to the accounts section and create a new account with name "Nequi", type "Neobank", initial balance $500,000, **Then** the account appears in my account list with the correct balance displayed.
2. **Given** I have 3 existing accounts, **When** I edit one account's name and color, **Then** the changes are reflected everywhere that account appears (transactions, dashboard, lists).
3. **Given** I have an account with transactions, **When** I archive (deactivate) the account, **Then** it no longer appears in active account lists, but its historical transactions remain visible in reports.
4. **Given** I am a new user upgrading from the previous version, **When** I log in for the first time, **Then** I see all my existing transactions have been assigned to a default "General" account, and the app prompts me to set up my real accounts.

---

### User Story 2 - Transactions Linked to Accounts (Priority: P1)

As a user, I want every income or expense to be associated with a specific account so that I can track the real balance of each account.

When I create a new transaction, I select which account the money comes from (for expenses) or goes into (for income). The account's balance updates immediately. When I view my transaction history, I can filter by account.

**Why this priority**: Transactions are the core data — linking them to accounts is what makes multi-account useful rather than cosmetic.

**Independent Test**: Create income and expense transactions on different accounts and verify each account's balance updates correctly.

**Acceptance Scenarios**:

1. **Given** my "Bancolombia" account has a balance of $2,000,000, **When** I create an expense of $150,000 from that account, **Then** the account balance becomes $1,850,000 in real-time.
2. **Given** I have 3 accounts, **When** I view the transactions page, **Then** I can filter transactions by account, seeing only transactions for the selected account.
3. **Given** I edit a transaction to change its account from "Nequi" to "Bancolombia", **When** the edit is saved, **Then** the old account's balance is restored and the new account's balance is updated.

---

### User Story 3 - Transfers Between Accounts (Priority: P1)

As a user, I want to record money transfers between my accounts so that when I move $500,000 from Bancolombia to Nequi, my total net worth stays the same but each account reflects the correct balance.

**Why this priority**: Transfers are a daily operation (moving money to neobank, paying credit card). Without this, users must create two manual transactions and totals break.

**Independent Test**: Create a transfer between two accounts and verify both balances update correctly and net worth remains unchanged.

**Acceptance Scenarios**:

1. **Given** "Bancolombia" has $2,000,000 and "Nequi" has $300,000, **When** I create a transfer of $500,000 from Bancolombia to Nequi, **Then** Bancolombia shows $1,500,000 and Nequi shows $800,000.
2. **Given** a transfer exists between two accounts, **When** I delete the transfer, **Then** both account balances are restored to their pre-transfer values.
3. **Given** I am viewing my transaction list, **When** I filter by transaction type, **Then** transfers appear as a distinct type alongside income and expense.

---

### User Story 4 - Dashboard: Hybrid View (Priority: P1)

As a user, I want my dashboard to show always-visible account balances and net worth at the top, with the month-filtered budget and transactions section below. The account section never changes when I switch months.

**Why this priority**: This is the main value proposition — seeing "where my money is" at a glance alongside "how I'm spending this month."

**Independent Test**: Navigate between months and verify account balances remain fixed while budget data changes.

**Acceptance Scenarios**:

1. **Given** I am on the dashboard viewing April 2026, **When** I switch to March 2026, **Then** the account balances section remains unchanged (real-time) while the budget summary shows March data.
2. **Given** I have 5 accounts (3 on-budget, 2 off-budget), **When** I view the dashboard, **Then** I see accounts grouped by on-budget and off-budget, with subtotals for each group and a total net worth.
3. **Given** I have a credit card with a $1,000,000 balance owed, **When** I view the dashboard, **Then** the credit card shows as a negative balance and correctly reduces my net worth.

---

### User Story 5 - Budget Scoped to On-Budget Accounts (Priority: P2)

As a user, I want my budgets to only consider transactions from accounts I've marked as "on-budget" so that investment or tracking-only accounts don't distort my monthly spending plan.

**Why this priority**: Without this distinction, moving money into an investment account would look like an "expense" in the budget.

**Independent Test**: Create transactions in on-budget and off-budget accounts for the same category and verify the budget only counts on-budget transactions.

**Acceptance Scenarios**:

1. **Given** I have a budget of $300,000 for "Alimentacion" and two accounts (Bancolombia=on-budget, Investment=off-budget), **When** I create a $100,000 grocery expense from Bancolombia and a $50,000 transaction from the investment account in the same category, **Then** the budget shows $100,000 spent, not $150,000.
2. **Given** I toggle an account from on-budget to off-budget, **When** I view the budget summary, **Then** transactions from that account are no longer counted in budget progress.

---

### User Story 6 - Recurring Transactions with Account (Priority: P2)

As a user, I want to assign recurring transactions to specific accounts so that projections show which account will be affected. "Netflix charges my Visa on the 15th" and "Salary arrives to Bancolombia on the 30th."

**Why this priority**: Makes projections account-aware, which is key for preventing overdrafts or planning cash flow.

**Independent Test**: Create a recurring transaction assigned to an account and verify that when it executes, the generated transaction is linked to the correct account and the balance updates.

**Acceptance Scenarios**:

1. **Given** I create a recurring expense of $50,000 for Netflix on my Visa account, **When** the recurring transaction executes on the scheduled date, **Then** the generated transaction is linked to the Visa account and Visa's balance increases by $50,000 (debt increases).
2. **Given** I have recurring transactions on multiple accounts, **When** I view the recurring transactions list, **Then** I can see which account each recurring transaction is assigned to.

---

### Edge Cases

- What happens when a user deletes an account that has transactions? The account must be archived (soft-deleted), not hard-deleted. Transactions retain the reference.
- What happens when a transfer involves an account being archived? The transfer remains visible in history but cannot be edited to use the archived account.
- What happens with existing transactions that have no account (pre-migration data)? They are assigned to a default "General" account or remain with null accountId and still display correctly.
- What happens when a user creates a transaction without selecting an account? The system should require an account selection for new transactions (after migration period). During migration, null is acceptable.
- How are credit card balances handled? Credit card accounts track what you owe. Expenses increase the balance (debt); payments (transfers from checking) decrease it. The balance displays as negative in net worth calculations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support creating, reading, updating, and archiving financial accounts per user.
- **FR-002**: Each account MUST have: name, type (checking, savings, credit card, cash, neobank, investment, loan, other), currency, initial balance, current balance, institution name (optional), color, icon, active status, budget inclusion flag, net worth inclusion flag, and display order.
- **FR-003**: System MUST support the following account types: CHECKING, SAVINGS, CREDIT_CARD, CASH, NEOBANK, INVESTMENT, LOAN, OTHER.
- **FR-004**: Every new transaction (income/expense) MUST be associated with an account. Existing pre-migration transactions MAY have a null account.
- **FR-005**: System MUST support a TRANSFER transaction type that moves money between two accounts in a single operation, updating both balances atomically.
- **FR-006**: Account balances MUST be updated in real-time (within the same database transaction) whenever a transaction is created, updated, or deleted.
- **FR-007**: The dashboard MUST display an always-visible account overview section (not filtered by month) showing all active accounts with current balances, grouped by on-budget and off-budget.
- **FR-008**: The dashboard MUST display net worth (sum of all accounts where includeInTotal=true, with credit cards and loans as negative values).
- **FR-009**: Budget calculations MUST only include transactions from accounts marked as includeInBudget=true.
- **FR-010**: Recurring transactions MUST support an optional account assignment. When executed, generated transactions inherit the account.
- **FR-011**: Transaction filtering MUST support filtering by account.
- **FR-012**: During migration, existing transactions MUST be assigned to a system-created default "General" account per user OR retain null accountId. No data may be lost.
- **FR-013**: Account archival MUST be soft-delete (isActive=false). Archived accounts and their transactions remain visible in history and reports.
- **FR-014**: Users MUST be able to reorder accounts for display purposes.
- **FR-015**: The transaction creation/edit form MUST include an account selector.
- **FR-016**: Transfer transactions MUST NOT require a category (they are not income or expense, just money movement).

### Key Entities

- **Account**: Represents a real-world financial account belonging to a user. Has a type, currency, running balance, and flags for budget and net worth inclusion. Related to many transactions and recurring transactions.
- **Transaction** (modified): Now optionally linked to an Account (source). For transfers, also linked to a destination Account. New TRANSFER type added.
- **RecurringTransaction** (modified): Now optionally linked to an Account, so generated transactions inherit account assignment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create at least 8 different account types and see real-time balances for each.
- **SC-002**: Creating, editing, or deleting a transaction updates the associated account balance within the same API response (no stale data).
- **SC-003**: Transfers between accounts result in zero net change to the user's total net worth.
- **SC-004**: Switching months on the dashboard does NOT change the account balances section.
- **SC-005**: Budget calculations correctly exclude transactions from off-budget accounts.
- **SC-006**: All existing transactions from pre-migration remain accessible and functional.
- **SC-007**: The accounts module follows the project's established module pattern (controller, service, schema, routes, tests).

## Assumptions

- Target users are individuals managing personal finances across multiple Colombian financial institutions and neobanks (Bancolombia, Davivienda, Nequi, Daviplata, Nu Colombia, Rappipay, etc.).
- Users will manually create accounts and set initial balances (no automatic bank syncing in this version).
- CSV import per account is out of scope for this feature but the data model should not block future implementation.
- The investment module continues to function independently. Investment-type accounts are tracked for balance purposes but do not replace the investment module's detailed tracking (returns, expected yield, etc.).
- Multi-currency accounts are supported at the data model level (each account has its own currency field) but cross-currency conversion/display is out of scope for now.
- The mobile/responsive experience follows the same hybrid dashboard pattern adapted to smaller screens.
