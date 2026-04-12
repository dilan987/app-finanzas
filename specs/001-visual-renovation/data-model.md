# Data Model: Complete Visual Renovation

**Feature**: 001-visual-renovation | **Date**: 2026-04-12

## Overview

This feature has **NO database or backend data model changes**. The renovation is purely frontend/presentation layer. All existing Prisma models, API contracts, and data flows remain unchanged.

## Frontend Data Entities (Design-Only)

### Design Token System

Not a database entity. Implemented as:
- Tailwind CSS theme configuration (`tailwind.config.ts`)
- CSS custom properties (`index.css`)

**Attributes**:
- Colors: primary scale (50-950), semantic (income, expense, invest, warning), neutral scale, surface/background
- Typography: font-family (Inter), size scale (xs through 4xl), weight scale (400-700), line-height scale
- Spacing: consistent 4px base unit rhythm
- Borders: radius scale (sm, md, lg, xl, 2xl), width (1px, 2px)
- Shadows: scale (xs, sm, md, lg, xl) for both light and dark modes
- Animations: duration tokens (fast: 150ms, normal: 200ms, slow: 300ms), easing curves
- Z-index: scale for sidebar (40), header (30), modal (50), bottom-tabs (40), toast (60)

### Component Library Registry

Not a database entity. Represents the catalog of reusable UI components:

| Component | Type | Variants |
|---|---|---|
| Button | ui | primary, secondary, danger, ghost, icon-only |
| Card | ui | default, stat, interactive (hover depth) |
| Input | ui | default, with-icon, textarea, error state |
| Select | ui | default, with-icon |
| Badge | ui | income, expense, info, warning, method |
| Modal | ui | default, form, confirm |
| Skeleton | ui | text, card, chart, avatar, row |
| Toggle | ui | default (animated) |
| AnimatedNumber | ui | count-up with formatting |
| ProgressBar | ui | default, threshold-colored |
| EmptyState | ui | with-icon, with-action |
| Pagination | ui | default |
| Sidebar | layout | expanded, collapsed |
| Header | layout | with-search, with-theme-toggle |
| BottomTabBar | layout | 5-item with FAB center |
| AuthLayout | layout | split-screen (desktop), stacked (mobile) |
| PageTransition | layout | fade+slide wrapper |

### UI State Extensions

Existing `uiStore` (Zustand) may need:
- `sidebarCollapsed: boolean` — persist sidebar collapse state to localStorage
- No other store changes needed

## Relationship to Existing Data

All existing API response types (`ApiResponse<T>`, `PaginatedResponse<T>`) and domain models (`Transaction`, `Budget`, `Investment`, etc.) remain unchanged. The visual renovation only changes **how** this data is rendered, not **what** data exists or how it flows.
