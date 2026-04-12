# Research: Complete Visual Renovation

**Feature**: 001-visual-renovation | **Date**: 2026-04-12

## R1: Framer Motion Compatibility with React 18

**Decision**: Use framer-motion v11.x (latest stable compatible with React 18)  
**Rationale**: framer-motion 11.x fully supports React 18. The package was rebranded to "motion" in v11 but maintains backward compatibility with the `framer-motion` import. It provides AnimatePresence for route transitions, motion components for entrance/exit animations, and `useReducedMotion` hook for accessibility.  
**Alternatives considered**:
- React Spring: Less intuitive API for layout animations, weaker AnimatePresence equivalent
- CSS-only animations: Cannot handle exit animations, staggered children, or layout transitions
- GSAP: Heavier bundle size, imperative API doesn't align with React declarative model

## R2: Inter Font Self-Hosting Strategy

**Decision**: Download Inter variable font (woff2) and bundle in `frontend/public/fonts/`  
**Rationale**: Variable font reduces file count to 2 files (regular + italic) while supporting all weights 100-900. WOFF2 format achieves ~30% better compression than WOFF. Self-hosting eliminates Google Fonts CDN dependency and improves FCP by avoiding external DNS + connection overhead. Files are included in the Vite build and served by nginx in Docker.  
**Alternatives considered**:
- Google Fonts CDN: Adds external dependency, fails in air-gapped Docker, adds 100-300ms latency
- Multiple static font files per weight: More HTTP requests, larger total download
- System fonts only: Cannot guarantee Inter's tabular figures for financial data alignment

## R3: Safe Dependency Upgrade Assessment

**Decision**: Upgrade these packages (minor/patch only):
- zustand: ^5.0.1 → ^5.0.12 (patch)
- axios: ^1.7.7 → ^1.15.0 (minor, backward compatible)
- react-hot-toast: ^2.4.1 → ^2.6.0 (minor)
- react-icons: ^5.3.0 → ^5.6.0 (minor)
- @testing-library/react: ^16.0.1 → ^16.3.2 (minor)
- postcss: ^8.4.49 → ^8.5.9 (minor)
- autoprefixer: ^10.4.20 → ^10.4.27 (patch)
- prettier: ^3.4.1 → ^3.8.2 (minor)

**Rationale**: All are semver-minor or patch bumps with no breaking changes. Each has been verified against the project's React 18, Vite 6, and Tailwind 3 setup.  
**NOT upgrading** (major version bumps with breaking changes): React 19, react-router-dom 7, Tailwind 4, Vite 8, TypeScript 6, ESLint 10, Recharts 3, Prisma 7.

## R4: Design Token Architecture in Tailwind 3

**Decision**: Extend Tailwind config `theme.extend` with custom design tokens, complemented by CSS custom properties in `index.css` for runtime theme switching.  
**Rationale**: Tailwind 3's `theme.extend` allows defining custom color scales, typography, spacing, and shadows that generate utility classes. CSS custom properties enable smooth theme transitions (dark↔light) without full page re-render. This hybrid approach gives Tailwind's utility-first DX while supporting animated theme transitions.  
**Alternatives considered**:
- CSS-in-JS (styled-components): Would require migrating entire codebase away from Tailwind
- Tailwind 4 @theme directive: Requires major version upgrade, violates FR-015
- Separate CSS files per theme: Poor DX, no smooth transitions

## R5: Skeleton Loading Implementation

**Decision**: Build a reusable `<Skeleton>` component using Tailwind's `animate-pulse` with variant props (text, card, chart, avatar, row).  
**Rationale**: A single component with variants ensures visual consistency across all loading states. Using Tailwind's built-in `animate-pulse` avoids adding animation dependencies. The component wraps standard divs with rounded corners and background colors matching the design system's surface colors.  
**Alternatives considered**:
- react-loading-skeleton library: Adds dependency for something achievable with 30 lines of Tailwind
- Shimmer effect (gradient animation): Higher GPU usage, diminishing returns on perceived improvement
- Spinner-only loading: Doesn't communicate page structure, causes layout shift when content loads

## R6: Mobile Bottom Tab Bar UX Pattern

**Decision**: Fixed-position bottom bar with 5 items: Dashboard (home icon), Transactions (list icon), Add (+) (center FAB-style button), Budgets (pie-chart icon), More (menu icon). The "More" button triggers a slide-up sheet with remaining navigation items.  
**Rationale**: 5 items is the mobile UX consensus maximum for bottom tabs. The center "Add" button follows the proven FAB (Floating Action Button) pattern used by finance apps like Mint and YNAB. The "More" sheet avoids forcing users through a hamburger menu for secondary features.  
**Alternatives considered**:
- Hamburger menu: Hidden navigation reduces discoverability
- 7-item bottom bar: Too crowded for mobile viewports
- Swipe-based navigation: Poor discoverability, accessibility concerns

## R7: Page Transition Strategy

**Decision**: Wrap route content with Framer Motion's `AnimatePresence` and `motion.div` using a subtle fade + vertical slide (y: 10px → 0) with 200ms duration and `ease-out` timing.  
**Rationale**: This pattern is lightweight, doesn't cause layout shifts, and provides a professional feel without being distracting. The 200ms duration stays under the 300ms "instant feel" threshold. Using `AnimatePresence` with `mode="wait"` ensures clean exit→enter sequencing.  
**Alternatives considered**:
- Full page slide transitions: Too aggressive for a finance app, undermines trust
- Cross-fade (opacity only): Feels flat, doesn't communicate navigation direction
- No transitions: Abrupt page changes feel jarring
