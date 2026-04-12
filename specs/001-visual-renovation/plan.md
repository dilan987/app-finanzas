# Implementation Plan: Complete Visual Renovation

**Branch**: `001-visual-renovation` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-visual-renovation/spec.md`

## Summary

Complete redesign of all 15 frontend pages and UI components to achieve a modern, professional financial dashboard. Purely presentation-layer changes: new design token system, redesigned components (sidebar, cards, forms, charts), Framer Motion animations, skeleton loading, responsive mobile layout with bottom tabs. Safe minor/patch dependency upgrades + adding framer-motion. Zero backend or data changes.

## Technical Context

**Language/Version**: TypeScript 5.6.x  
**Primary Dependencies**: React 18.3, Vite 6, Tailwind CSS 3.4, Zustand 5, Recharts 2.13, Framer Motion (new)  
**Storage**: PostgreSQL 16 (unchanged — no DB access from this feature)  
**Testing**: Vitest + React Testing Library (frontend only)  
**Target Platform**: Web (Docker — nginx serving static build)  
**Project Type**: SPA frontend renovation  
**Performance Goals**: FCP < 2s, animations at 60fps, no layout shifts  
**Constraints**: No backend changes, no major version bumps, no DB modifications, all existing tests must pass  
**Scale/Scope**: 15 pages, ~14 UI components, 4 chart components, 4 layout components, 1 form component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Modular Architecture | PASS | No backend changes. Frontend component structure maintained (ui/, layout/, charts/, forms/) |
| II. Type Safety | PASS | All new components will be fully typed TypeScript. No `any` types. Framer Motion has full TS support. |
| III. Validation at Boundaries | PASS | No API or form validation logic changes. Only presentation layer affected. |
| IV. Security First | PASS | No auth, token, or security changes. |
| V. Test Coverage | PASS | Existing tests must continue passing. New visual components tested via visual inspection + existing integration tests. |
| Dark/Light Mode | PASS | Core requirement of this feature (FR-002). Both modes designed simultaneously. |
| Decimal Handling | PASS | No changes to financial calculations. Only display formatting. |
| Docker Compose | PASS | Frontend Dockerfile unchanged in structure. Self-hosted fonts bundled with build. |

**GATE RESULT: ALL PASS** — No constitution violations. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/001-visual-renovation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── design-tokens.md
│   ├── component-contracts.md
│   └── animation-contracts.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code Changes (frontend only)

```text
frontend/
├── public/
│   └── fonts/                    # NEW: Self-hosted Inter font files
├── src/
│   ├── components/
│   │   ├── ui/                   # MODIFY: All 14 UI components redesigned
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── MonthSelector.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── Skeleton.tsx       # NEW: Skeleton loading component
│   │   │   ├── Toggle.tsx         # NEW: Animated toggle switch
│   │   │   └── AnimatedNumber.tsx # NEW: Count-up number animation
│   │   ├── layout/               # MODIFY: All layout components redesigned
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── BottomTabBar.tsx   # NEW: Mobile bottom navigation
│   │   │   ├── PageTransition.tsx # NEW: Framer Motion page wrapper
│   │   │   └── AuthLayout.tsx     # NEW: Split-screen auth layout
│   │   ├── charts/               # MODIFY: All chart components restyled
│   │   │   ├── BudgetProgressList.tsx
│   │   │   ├── CategoryPieChart.tsx
│   │   │   ├── IncomeExpenseBarChart.tsx
│   │   │   ├── TrendLineChart.tsx
│   │   │   └── ChartTooltip.tsx   # NEW: Custom themed chart tooltip
│   │   └── forms/
│   │       └── TransactionForm.tsx # MODIFY: Restyled form
│   ├── pages/                    # MODIFY: All 15 pages redesigned
│   ├── hooks/
│   │   └── useAnimatedNumber.ts  # NEW: Hook for count-up animations
│   ├── index.css                 # MODIFY: New design tokens, font imports
│   └── App.tsx                   # MODIFY: Add PageTransition wrapper
├── tailwind.config.ts            # MODIFY: Updated theme tokens
└── package.json                  # MODIFY: Add framer-motion, upgrade minor deps
```

## Implementation Strategy

### Phase 1: Foundation (Design System + Dependencies)
1. Upgrade safe dependencies (minor/patch)
2. Install framer-motion
3. Download and bundle Inter font files
4. Update `tailwind.config.ts` with new design tokens (colors, typography, shadows, animations)
5. Update `index.css` with @font-face declarations and base design tokens
6. Create animation utility hooks and components

### Phase 2: Core Components (Bottom-Up)
1. Redesign all `ui/` components with new design system
2. Create new components (Skeleton, Toggle, AnimatedNumber)
3. Redesign all `layout/` components (Sidebar, Header, MainLayout)
4. Create new layout components (BottomTabBar, PageTransition, AuthLayout)
5. Restyle all `charts/` components with gradients and tooltips
6. Restyle `forms/` components

### Phase 3: Pages (Top-Down by Priority)
1. P1 pages: Auth pages (Login, Register, ForgotPassword, ResetPassword)
2. P1 pages: Dashboard
3. P1 pages: Transactions, TransactionDetail, Categories
4. P2 pages: Budgets, Analytics
5. P2 pages: Investments, Recurring
6. P2 pages: Reports, Profile, Settings

### Phase 4: Polish & Deploy
1. Test all pages in both themes at all breakpoints
2. Verify existing tests pass
3. Build and deploy in Docker
4. Visual QA across full application

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Adding framer-motion dependency | Required for page transitions, card animations, and staggered entrances (FR-008, FR-009) | CSS-only animations can't handle layout animations, staggered children, or AnimatePresence for route transitions |
| New Skeleton component | Required for loading states (FR-004) | Tailwind `animate-pulse` alone can't match complex card layouts; a reusable component ensures consistency |
| New BottomTabBar component | Required for mobile navigation (FR-003) | Hiding sidebar on mobile is insufficient; mobile UX requires thumb-zone accessible tabs |
| New AuthLayout component | Required for split-screen auth (FR-010) | Inline layout per page would duplicate code across 4 auth pages |
| Self-hosted fonts | Required for Docker offline support (Clarification Q1) | CDN approach fails in air-gapped Docker environments |

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|---|---|---|
| I. Modular Architecture | PASS | New components follow existing folder structure conventions |
| II. Type Safety | PASS | All new files are .tsx/.ts with full typing |
| III. Validation at Boundaries | PASS | No validation logic touched |
| IV. Security First | PASS | No security surface changes |
| V. Test Coverage | PASS | Existing test suite validates functional correctness |
| Dark/Light Mode | PASS | Dual-theme is designed into every token and component |
| Docker Compose | PASS | Self-hosted fonts eliminate external dependencies |

**FINAL GATE: ALL PASS**
