# Quickstart: Visual Renovation Validation

**Feature**: 001-visual-renovation | **Date**: 2026-04-12

## Prerequisites

1. Backend running on port 4000 (or via Docker)
2. PostgreSQL with seeded data (test user with transactions, budgets, investments)
3. Frontend dev server on port 5173 OR Docker nginx on port 3000

## Validation Scenarios

### V1: Design System Foundation
1. Open browser DevTools → Elements tab
2. Inspect any card element → verify it uses design token classes (not hardcoded colors)
3. Toggle dark/light mode → verify all elements transition smoothly
4. Check font in computed styles → must be "Inter"

### V2: Auth Pages
1. Navigate to `/login` on desktop (>1024px) → verify split-screen layout
2. Resize to <640px → verify single-column layout
3. Navigate to `/register` → verify same layout pattern
4. Toggle dark mode → verify contrast and no pure black

### V3: Sidebar Navigation
1. Log in → verify sidebar is visible with icons + labels
2. Click collapse button → sidebar shrinks to icons only, content expands
3. Click each nav item → verify page transition animation
4. Resize to <640px → sidebar disappears, bottom tab bar appears

### V4: Dashboard
1. Load dashboard → verify skeleton loading states appear first
2. Verify balance shows with count-up animation
3. Verify stat cards have staggered entrance animation
4. Verify area chart has gradient fill and animates in
5. Hover over chart → verify styled tooltip appears
6. Verify recent transactions have semantic colors (green/red)
7. Verify budget progress bars animate and are threshold-colored

### V5: Transactions Page
1. Navigate to Transactions → verify page transition
2. Verify transaction list has category icons, formatted amounts, badges
3. Click "Add" → verify modal animates in
4. Apply a filter → verify smooth content transition
5. Test on mobile viewport → verify responsive layout

### V6: Charts & Analytics
1. Navigate to Analytics → verify all charts render with gradients
2. Hover over data points → verify tooltips styled with design system
3. Verify income (green), expense (red), investment (purple) colors
4. Navigate to Budgets → verify animated progress bars

### V7: Mobile Navigation
1. Set viewport to 375px width
2. Verify bottom tab bar with 5 items
3. Tap each tab → verify navigation works
4. Tap "More" → verify slide-up menu with remaining items
5. Tap "Add (+)" → verify transaction form opens

### V8: Existing Functionality
1. Create a new transaction → verify it saves and appears in list
2. Edit a transaction → verify changes persist
3. Create a budget → verify it appears in budgets page
4. Toggle a recurring transaction → verify state changes
5. Download a report → verify PDF/CSV downloads
6. Update profile → verify changes save
7. Log out and log back in → verify auth flow works

### V9: Docker Deployment
1. Run `docker-compose up --build`
2. Navigate to `http://localhost:3000`
3. Verify frontend loads with new design
4. Verify API calls work through nginx proxy
5. Complete V8 scenarios in Docker environment

### V10: Performance
1. Open Lighthouse in Chrome DevTools
2. Run performance audit → FCP should be < 2s
3. Navigate between pages → no visible jank
4. Open Performance tab → record page transitions → verify 60fps

## Quick Smoke Test (5 minutes)
1. `cd frontend && npm run dev`
2. Open http://localhost:5173/login → verify new design
3. Log in → verify dashboard with animations
4. Navigate 3 pages → verify transitions
5. Toggle dark/light mode → verify consistency
6. Resize to mobile → verify bottom tabs
