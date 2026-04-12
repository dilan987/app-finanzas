# Tasks: Complete Visual Renovation

**Input**: Design documents from `specs/001-visual-renovation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US8)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Dependencies & Font Assets)

- [X] T001 [US8] Upgrade safe minor/patch dependencies in `frontend/package.json`: zustand ^5.0.12, axios ^1.15.0, react-hot-toast ^2.6.0, react-icons ^5.6.0, @testing-library/react ^16.3.2, postcss ^8.5.9, autoprefixer ^10.4.27, prettier ^3.8.2
- [X] T002 [US8] Install framer-motion package in `frontend/package.json`
- [X] T003 [US8] Download Inter variable font (woff2) to `frontend/public/fonts/inter-variable.woff2` and `frontend/public/fonts/inter-variable-italic.woff2`

**Checkpoint**: Dependencies installed, font assets in place

---

## Phase 2: Foundational Design System (Blocking Prerequisites)

- [X] T004 [US8] Update `frontend/tailwind.config.ts` with complete design token system: extended color palette (primary 50-950, semantic income/expense/invest/warning with light+dark variants), surface colors, text colors, typography (Inter font family), shadow scale (xs through card-hover), border radius scale, z-index scale, animation duration/easing tokens per `contracts/design-tokens.md`
- [X] T005 [US8] Rewrite `frontend/src/index.css` with @font-face declarations for self-hosted Inter, CSS custom properties for theme-aware surface/text/border/shadow colors, updated base layer styles, component layer classes (.card, .btn-*, .input, .label, .badge-*), smooth theme transition utilities, and `prefers-reduced-motion` media query overrides
- [X] T006 [US8] Update `frontend/src/store/uiStore.ts` to add `sidebarCollapsed` boolean state with `toggleSidebar` / `setSidebarCollapsed` actions persisted to localStorage

**Checkpoint**: Design system tokens in place — component redesign can begin

---

## Phase 3: Core UI Components (US8 - Design System Consistency)

**Goal**: Redesign all base UI components to use new design tokens
**Independent Test**: Import any component in isolation and verify it renders with new design system tokens in both themes

### New Components

- [X] T007 [P] [US8] Create `frontend/src/components/ui/Skeleton.tsx` — reusable skeleton loader with variants (text, circular, rectangular, card, chart) per component contract, using Tailwind animate-pulse with design system surface colors
- [X] T008 [P] [US8] Create `frontend/src/components/ui/Toggle.tsx` — animated toggle switch with sm/md sizes, smooth transition, design system primary color for active state
- [X] T009 [P] [US8] Create `frontend/src/components/ui/AnimatedNumber.tsx` — count-up number display using requestAnimationFrame, accepts formatFn (e.g. formatCurrency), respects reduced motion
- [X] T010 [P] [US8] Create `frontend/src/hooks/useAnimatedNumber.ts` — hook for count-up animation logic with duration, easing, and reduced motion support

### Redesigned UI Components

- [X] T011 [P] [US8] Redesign `frontend/src/components/ui/Button.tsx` — add variant (primary/secondary/danger/ghost), size (sm/md/lg), loading state with spinner, icon support with position, design system colors/radius/shadows
- [X] T012 [P] [US8] Redesign `frontend/src/components/ui/Card.tsx` — add variant (default/stat/interactive), entrance animation via framer-motion with stagger support, hover depth effect (translateY -2px + shadow-card-hover), design system surface/border/radius tokens
- [X] T013 [P] [US8] Redesign `frontend/src/components/ui/Input.tsx` — consistent height (min 44px), focus ring with primary color, inline error state with red border + helper text, design system typography/colors
- [X] T014 [P] [US8] Redesign `frontend/src/components/ui/Select.tsx` — match Input styling, custom chevron icon, focus ring, error state, design system tokens
- [X] T015 [P] [US8] Redesign `frontend/src/components/ui/Badge.tsx` — semantic variants (income/expense/info/warning/method), design system semantic color tokens with light background
- [X] T016 [P] [US8] Redesign `frontend/src/components/ui/Modal.tsx` — framer-motion enter/exit (backdrop opacity + content scale 0.95→1), design system surface/shadow tokens, improved close button
- [X] T017 [P] [US8] Redesign `frontend/src/components/ui/StatCard.tsx` — icon with colored background circle, large metric number, trend indicator (up/down arrow + percentage), design system card tokens
- [X] T018 [P] [US8] Redesign `frontend/src/components/ui/ProgressBar.tsx` — add animated prop (fill from 0 on mount, 600ms ease-out), thresholdColors prop (green <70%, amber 70-90%, red >90%), showLabel prop, design system tokens
- [X] T019 [P] [US8] Redesign `frontend/src/components/ui/EmptyState.tsx` — centered layout with icon, title, description, optional action button, design system colors/typography
- [X] T020 [P] [US8] Redesign `frontend/src/components/ui/Pagination.tsx` — button-style page numbers, active state with primary color, hover effects, design system tokens
- [X] T021 [P] [US8] Redesign `frontend/src/components/ui/Spinner.tsx` — primary color spinner, size variants, design system tokens
- [X] T022 [P] [US8] Redesign `frontend/src/components/ui/ConfirmDialog.tsx` — use redesigned Modal, danger variant for delete actions, design system tokens
- [X] T023 [P] [US8] Redesign `frontend/src/components/ui/DatePicker.tsx` — match Input styling, calendar popup with design system tokens
- [X] T024 [P] [US8] Redesign `frontend/src/components/ui/MonthSelector.tsx` — clean month/year navigation with arrow buttons, design system tokens

**Checkpoint**: All UI primitives redesigned — layout and page work can proceed

---

## Phase 4: Layout Components (US3 - Navigation + US8)

**Goal**: Redesign navigation shell (sidebar, header, bottom tabs, page transitions)
**Independent Test**: Log in and navigate between pages; verify sidebar collapse, mobile bottom tabs, and page transitions

### New Layout Components

- [X] T025 [US3] Create `frontend/src/components/layout/PageTransition.tsx` — framer-motion AnimatePresence wrapper with fade+slide (y:10→0, 200ms ease-out) per animation contract, useReducedMotion check
- [X] T026 [US3] Create `frontend/src/components/layout/BottomTabBar.tsx` — fixed bottom bar for mobile (<640px) with 5 items: Dashboard, Transactions, Add (+) center FAB, Budgets, More. Active state with primary color, "More" triggers slide-up sheet with remaining nav items
- [X] T027 [US1] Create `frontend/src/components/layout/AuthLayout.tsx` — split-screen on desktop (60% branding panel with gradient + logo + tagline / 40% form panel), single-column stacked on mobile, design system colors, subtle background pattern or gradient for branding panel

### Redesigned Layout Components

- [X] T028 [US3] Redesign `frontend/src/components/layout/Sidebar.tsx` — collapsible (260px→64px) with smooth animation, nav items with icons + labels (hidden when collapsed), active state with primary-50/primary-500 highlight, user section at bottom, collapse toggle button, hidden on mobile, design system surface/border colors
- [X] T029 [US3] Redesign `frontend/src/components/layout/Header.tsx` — sticky top with backdrop-blur, theme toggle (sun/moon icon with smooth rotation), user avatar dropdown, breadcrumb or page title, simplified on mobile (logo + avatar only), design system tokens
- [X] T030 [US3] Redesign `frontend/src/components/layout/MainLayout.tsx` — integrate collapsible sidebar, header, content area with PageTransition, BottomTabBar for mobile, read sidebarCollapsed from uiStore, bottom padding on mobile for tab bar (64px + safe area)
- [X] T031 [P] [US3] Redesign `frontend/src/components/layout/Footer.tsx` — minimal footer with design system text-tertiary color, hidden on mobile when bottom tabs visible

### App Integration

- [X] T032 [US3] Update `frontend/src/App.tsx` — wrap routes with AnimatePresence from framer-motion, integrate PageTransition in route rendering, update toast styling to match design system tokens
- [X] T033 [US3] Update `frontend/src/routes/AppRoutes.tsx` — ensure auth pages use AuthLayout, authenticated pages use MainLayout with PageTransition, maintain lazy loading

**Checkpoint**: Navigation shell complete — sidebar collapses, bottom tabs on mobile, page transitions animate

---

## Phase 5: Chart Components (US5 - Budget Tracking & Analytics)

**Goal**: Restyle all charts with gradient fills, semantic colors, and custom tooltips
**Independent Test**: Navigate to Dashboard and Analytics; verify charts render with gradients, animations, and themed tooltips

- [X] T034 [US5] Create `frontend/src/components/charts/ChartTooltip.tsx` — custom Recharts tooltip matching design system: rounded card with shadow, formatted values, design system surface/text colors
- [X] T035 [P] [US5] Redesign `frontend/src/components/charts/TrendLineChart.tsx` — area chart with SVG linearGradient fill (primary-500 at 40% opacity → transparent), custom ChartTooltip, animated draw-in (500ms), responsive container, design system grid line colors
- [X] T036 [P] [US5] Redesign `frontend/src/components/charts/IncomeExpenseBarChart.tsx` — grouped bars with income (#22c55e) and expense (#ef4444) colors, rounded bar caps, custom ChartTooltip, animated draw-in, design system grid colors
- [X] T037 [P] [US5] Redesign `frontend/src/components/charts/CategoryPieChart.tsx` — donut/ring chart (not full pie) with chart color sequence, center total label, custom ChartTooltip, animated draw-in, legend with category names
- [X] T038 [P] [US5] Redesign `frontend/src/components/charts/BudgetProgressList.tsx` — use redesigned ProgressBar with animated + thresholdColors props, category icon + name + amount/limit labels, staggered entrance animation

**Checkpoint**: All charts restyled with gradients, tooltips, and animations

---

## Phase 6: Form Components (US4 - Transactions)

**Goal**: Restyle transaction form with new design system
**Independent Test**: Open transaction form modal; verify inputs, selects, and buttons match design system

- [X] T039 [US4] Redesign `frontend/src/components/forms/TransactionForm.tsx` — redesigned inputs/selects with consistent styling, inline validation feedback, semantic type selector (income green / expense red), proper spacing, design system tokens

**Checkpoint**: Form components restyled

---

## Phase 7: Auth Pages (US1 - First Impression)

**Goal**: Redesign all 4 auth pages with AuthLayout split-screen pattern
**Independent Test**: Navigate to /login, /register, /forgot-password, /reset-password; verify split-screen desktop, stacked mobile, dark/light mode

- [X] T040 [US1] Redesign `frontend/src/pages/LoginPage.tsx` — use AuthLayout, polished form with email + password inputs, "Iniciar Sesion" primary button, "Olvidaste tu contrasena?" link, "Crear cuenta" secondary link, smooth entrance animation
- [X] T041 [P] [US1] Redesign `frontend/src/pages/RegisterPage.tsx` — use AuthLayout, registration form with name + email + password + confirm fields, primary button, link to login
- [X] T042 [P] [US1] Redesign `frontend/src/pages/ForgotPasswordPage.tsx` — use AuthLayout, email-only form with clear instructions, primary button, back to login link
- [X] T043 [P] [US1] Redesign `frontend/src/pages/ResetPasswordPage.tsx` — use AuthLayout, new password + confirm fields, primary button

**Checkpoint**: Auth pages complete with professional split-screen design

---

## Phase 8: Dashboard Page (US2 - Dashboard Overview)

**Goal**: Redesign dashboard with visual hierarchy, skeleton loading, animated stats
**Independent Test**: Log in and verify dashboard: skeleton → animated count-up balance → stat cards → trend chart → transactions → budget progress

- [X] T044 [US2] Redesign `frontend/src/pages/DashboardPage.tsx` — complete layout overhaul: (1) greeting + month selector header row, (2) large balance card with AnimatedNumber count-up, (3) 3-4 StatCards row (income, expenses, savings rate, transactions count) with staggered entrance, (4) TrendLineChart with gradient fill, (5) recent transactions list with semantic colors, (6) BudgetProgressList with animated bars. Skeleton loading state for each section. Responsive grid: 1col mobile, 2col tablet, 3-4col desktop

**Checkpoint**: Dashboard complete — the hero page of the renovation

---

## Phase 9: Transaction Pages (US4 - Managing Transactions)

**Goal**: Redesign transaction list, detail, and categories pages
**Independent Test**: View transactions, filter, create, edit, view detail, manage categories

- [X] T045 [US4] Redesign `frontend/src/pages/TransactionsPage.tsx` — clean table/list with category color dot + icon, description, formatted date, payment method Badge, semantic amount coloring (green/red), filter bar with tab-style type filter + search + date range, skeleton loading, pagination, "Add" FAB on mobile, empty state
- [X] T046 [US4] Redesign `frontend/src/pages/TransactionDetailPage.tsx` — card-based detail view with large amount (semantic color), category badge, date, payment method, description, edit/delete action buttons, back navigation
- [X] T047 [P] [US4] Redesign `frontend/src/pages/CategoriesPage.tsx` — grid of category cards with icon + color indicator + name + transaction count, add/edit category modal, type filter tabs (income/expense), design system tokens

**Checkpoint**: Transaction management pages complete

---

## Phase 10: Budget & Analytics Pages (US5)

**Goal**: Redesign budget tracking and analytics visualization pages
**Independent Test**: View budgets with animated progress bars; view analytics charts with gradients and tooltips

- [X] T048 [US5] Redesign `frontend/src/pages/BudgetsPage.tsx` — summary cards row (total budget, spent, remaining with semantic colors), budget list with animated threshold-colored progress bars, category icon + name + amount/limit, add/edit budget modal, month selector, empty state
- [X] T049 [US5] Redesign `frontend/src/pages/AnalyticsPage.tsx` — summary stat cards, spending trend area chart (gradient fill), income vs expense bar chart, category breakdown donut chart, recommendations section with severity-colored cards, date range selector, skeleton loading

**Checkpoint**: Budget and analytics pages complete

---

## Phase 11: Investment & Recurring Pages (US6)

**Goal**: Redesign investment portfolio and recurring transaction management
**Independent Test**: View investments with portfolio summary; toggle recurring transactions

- [X] T050 [US6] Redesign `frontend/src/pages/InvestmentsPage.tsx` — portfolio summary card (total value with AnimatedNumber, total return with semantic color), investment cards grid with type Badge, amount invested, current value, return %, active/inactive badge, add/edit modal, empty state
- [X] T051 [US6] Redesign `frontend/src/pages/RecurringPage.tsx` — upcoming payments section, recurring list with frequency Badge, amount, next execution date, active Toggle with smooth animation, dimmed styling for inactive, add/edit modal, empty state

**Checkpoint**: Investment and recurring pages complete

---

## Phase 12: Reports, Profile & Settings Pages (US7)

**Goal**: Redesign remaining pages maintaining design system consistency
**Independent Test**: Generate reports, update profile, change settings

- [X] T052 [P] [US7] Redesign `frontend/src/pages/ReportsPage.tsx` — report type selector (PDF/CSV), date range picker, download buttons with loading state (spinner in button), report preview section, design system tokens
- [X] T053 [P] [US7] Redesign `frontend/src/pages/ProfilePage.tsx` — user info card with avatar placeholder + name + email, edit profile form section, change password section, danger zone (delete account) with confirm dialog, design system tokens
- [X] T054 [P] [US7] Redesign `frontend/src/pages/SettingsPage.tsx` — organized sections: appearance (theme toggle with live preview), currency preference, timezone, notifications preferences, design system tokens

**Checkpoint**: All 15 pages redesigned

---

## Phase 13: Polish & Cross-Cutting Concerns

- [X] T055 [US8] Verify all pages in light mode at viewports 320/640/768/1024/1280/1920px — fix any layout breaks
- [X] T056 [US8] Verify all pages in dark mode at viewports 320/640/768/1024/1280/1920px — fix any contrast or theme issues
- [X] T057 [US8] Verify prefers-reduced-motion behavior — all animations disabled or replaced with instant transitions
- [X] T058 [US8] Run existing frontend test suite (`cd frontend && npm run test`) — fix any failures caused by component interface changes
- [X] T059 [US8] Run frontend production build (`cd frontend && npm run build`) — verify no TypeScript errors, no build warnings
- [X] T060 [US8] Deploy with Docker (`docker-compose up --build`) — verify frontend serves correctly, API proxy works, all CRUD operations functional
- [X] T061 [US8] Run quickstart.md validation scenarios V1–V10 — verify all pass

**Checkpoint**: All quality gates passed — renovation complete

---

## Dependencies & Execution Order

```
Phase 1 (Setup)          → No dependencies
Phase 2 (Design System)  → Depends on Phase 1 — BLOCKS everything
Phase 3 (UI Components)  → Depends on Phase 2 — tasks within are parallelizable [P]
Phase 4 (Layout)         → Depends on Phase 2 + selected Phase 3 components (Card, Button)
Phase 5 (Charts)         → Depends on Phase 2 + T018 (ProgressBar)
Phase 6 (Forms)          → Depends on Phase 3 (Input, Select, Button)
Phase 7 (Auth Pages)     → Depends on T027 (AuthLayout) + Phase 3 (Input, Button)
Phase 8 (Dashboard)      → Depends on Phase 4 (MainLayout) + Phase 5 (Charts) + Phase 3 (StatCard, Skeleton)
Phase 9 (Transactions)   → Depends on Phase 4 (MainLayout) + Phase 3 + Phase 6
Phase 10 (Budgets/Ana.)  → Depends on Phase 4 + Phase 5
Phase 11 (Invest/Recur.) → Depends on Phase 4 + Phase 3 (Toggle, Badge)
Phase 12 (Reports/Prof.) → Depends on Phase 4 + Phase 3
Phase 13 (Polish)        → Depends on ALL previous phases
```

### Parallel Opportunities

The following phase groups can execute concurrently once their dependencies are met:

- **Group A** (after Phase 4): Phase 7 + Phase 8 + Phase 9 (if Phase 5+6 done)
- **Group B** (after Phase 4): Phase 10 + Phase 11 + Phase 12
- **Within Phase 3**: All 18 UI component tasks (T007–T024) are fully parallelizable

---

## Summary

| Metric | Count |
|---|---|
| **Total Tasks** | 61 |
| **US1 (Auth)** | 5 tasks (T027, T040–T043) |
| **US2 (Dashboard)** | 1 task (T044) |
| **US3 (Navigation)** | 9 tasks (T025–T033) |
| **US4 (Transactions)** | 4 tasks (T039, T045–T047) |
| **US5 (Budgets/Analytics)** | 7 tasks (T034–T038, T048–T049) |
| **US6 (Invest/Recurring)** | 2 tasks (T050–T051) |
| **US7 (Reports/Profile/Settings)** | 3 tasks (T052–T054) |
| **US8 (Design System)** | 30 tasks (T001–T024, T055–T061) |
| **Parallelizable [P]** | 28 tasks |
| **MVP scope** | Phases 1–4 + Phase 8 (design system + navigation + dashboard = 39 tasks) |
