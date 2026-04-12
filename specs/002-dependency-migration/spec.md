# Feature Specification: Full-Stack Dependency Migration

**Feature Branch**: `002-dependency-migration`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: Comprehensive upgrade of all project dependencies to their latest stable versions across frontend, backend, and infrastructure.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Backend Remains Fully Operational After Migration (Priority: P1)

As a developer, I need the backend API to continue functioning identically after all backend dependencies are upgraded to their latest major versions so that no existing data is lost and all API consumers (the frontend) continue working without changes.

**Why this priority**: The backend manages all persistent data (PostgreSQL) and business logic. Any regression here risks data corruption or loss of functionality. This is the highest-risk layer because Prisma, Express, and Zod touch every module.

**Independent Test**: Run the full backend test suite, hit every API endpoint manually, and verify all CRUD operations return identical responses to pre-migration behavior.

**Acceptance Scenarios**:

1. **Given** the backend is running with upgraded dependencies, **When** a user logs in with existing credentials, **Then** authentication succeeds and returns valid JWT tokens.
2. **Given** existing transactions in the database, **When** the transactions API is queried, **Then** all existing data is returned with correct structure and values.
3. **Given** Prisma has been upgraded to v7, **When** the backend starts, **Then** it connects to the existing PostgreSQL database and all migrations/schema remain intact without data loss.
4. **Given** Express has been upgraded to v5, **When** any API endpoint is called, **Then** it responds with the same status codes, headers, and body format as before.
5. **Given** Zod has been upgraded to v4, **When** invalid input is submitted to any endpoint, **Then** validation errors are returned with appropriate messages.

---

### User Story 2 - Frontend Builds and Runs Correctly After Migration (Priority: P1)

As a user, I need the frontend application to look and function identically after all frontend dependencies are upgraded so that my daily workflow of managing finances is uninterrupted.

**Why this priority**: The frontend is what users interact with directly. React 18→19, Vite 6→8, and Tailwind 3→4 are the three most impactful migrations that touch every component and stylesheet.

**Independent Test**: Run production build, navigate every page in both light and dark mode, verify all interactive features (forms, modals, charts, navigation).

**Acceptance Scenarios**:

1. **Given** React has been upgraded to v19, **When** the frontend builds, **Then** no TypeScript or compilation errors occur and all components render correctly.
2. **Given** Tailwind CSS has been upgraded to v4, **When** any page is viewed in light and dark mode, **Then** all styles, colors, spacing, and responsive breakpoints match the pre-migration design.
3. **Given** Vite has been upgraded to v8, **When** `npm run build` is executed, **Then** the production build succeeds and generates valid output.
4. **Given** React Router has been upgraded to v7, **When** the user navigates between pages, **Then** all routes resolve correctly including protected routes and page transitions.
5. **Given** Framer Motion has been rebranded to Motion v12, **When** page transitions and animations trigger, **Then** they animate identically to pre-migration behavior.

---

### User Story 3 - TypeScript and Linting Toolchain Upgraded (Priority: P2)

As a developer, I need TypeScript, ESLint, and related tooling upgraded to their latest major versions so that the codebase benefits from modern language features, better error checking, and improved developer experience.

**Why this priority**: TypeScript 6 and ESLint 10 affect every file in both frontend and backend. They must be migrated together since they share configuration patterns. Lower priority than runtime dependencies because they only affect development.

**Independent Test**: Run `tsc --noEmit` in both frontend and backend. Run `eslint .` in both. Verify zero errors.

**Acceptance Scenarios**:

1. **Given** TypeScript has been upgraded to v6, **When** type checking is run on both frontend and backend, **Then** zero type errors are reported.
2. **Given** ESLint has been migrated to v10 with flat config, **When** linting is run on both codebases, **Then** zero linting errors are reported and the same rules are enforced.
3. **Given** all `@types/*` packages have been updated, **When** TypeScript compiles, **Then** no missing or incompatible type definitions exist.

---

### User Story 4 - Test Suites Pass on Upgraded Dependencies (Priority: P2)

As a developer, I need all existing tests to pass after dependency upgrades so that I have confidence the migration introduced no regressions.

**Why this priority**: Tests are the safety net for this migration. Jest 29→30 and Vitest 2→4 are significant upgrades that may require snapshot regeneration and test adjustments.

**Independent Test**: Run `npm run test` in both frontend and backend directories and verify all tests pass.

**Acceptance Scenarios**:

1. **Given** Jest has been upgraded to v30, **When** the backend test suite runs, **Then** all existing tests pass (snapshots regenerated where format changed).
2. **Given** Vitest has been upgraded to v4, **When** the frontend test suite runs, **Then** all tests pass.
3. **Given** jsdom has been upgraded to v29, **When** DOM-related tests run, **Then** they produce correct results.

---

### User Story 5 - Docker Deployment Works End-to-End (Priority: P1)

As a user/operator, I need the Docker deployment to build and run successfully with all upgraded dependencies so that the production environment works seamlessly.

**Why this priority**: Docker is the production deployment mechanism. Node.js 20→24 and PostgreSQL 16→18 base image changes must be validated in the actual container environment.

**Independent Test**: Run `docker-compose up --build`, wait for all services to be healthy, then verify the frontend loads, API responds, and database is accessible with existing data.

**Acceptance Scenarios**:

1. **Given** Docker base images are updated (node:24-alpine for backend/frontend, postgres:16-alpine stays), **When** `docker-compose up --build` is run, **Then** all three containers start successfully.
2. **Given** PostgreSQL remains on v16, **When** the database container starts with the existing data volume after all other upgrades, **Then** all existing data is preserved and accessible.
3. **Given** the full stack is running in Docker, **When** a user accesses the app at localhost:3000, **Then** the frontend loads, API calls succeed, and all features work.

---

### User Story 6 - Nodemailer License Compatibility Assessed (Priority: P3)

As a project maintainer, I need to evaluate whether Nodemailer 8's license change (MIT → EUPL-1.1) is compatible with the project before upgrading, and decide whether to upgrade, pin the old version, or switch to an alternative.

**Why this priority**: License changes can have legal implications. This is lower priority because the email functionality is secondary, but must be addressed before shipping.

**Independent Test**: Review EUPL-1.1 license terms and compare with project's usage. Document the decision.

**Acceptance Scenarios**:

1. **Given** Nodemailer 8 uses EUPL-1.1 license, **When** the license is reviewed, **Then** a documented decision is made: upgrade, stay on v6, or switch to alternative.
2. **Given** the decision is made, **When** the dependency is configured, **Then** the email sending functionality continues to work.

---

### Edge Cases

- What happens when PostgreSQL 18 receives data created by PostgreSQL 16? (Backward compatibility must be validated)
- How does `prisma db push` behave with Prisma 7 against an existing Prisma 5-generated schema?
- What happens if a Tailwind utility class was renamed in v4 but is used dynamically (string concatenation) in the codebase?
- What happens if a React component uses `forwardRef` which is no longer needed in React 19?
- How does the Express 5 wildcard route parameter change affect existing route definitions?
- What happens to existing localStorage data (Zustand persisted state) after the Zustand version stays the same but surrounding libraries change?

---

## Requirements *(mandatory)*

### Functional Requirements

**Backend Runtime:**
- **FR-001**: System MUST upgrade Prisma from v5 to v7 while preserving all existing database data and schema integrity.
- **FR-002**: System MUST upgrade Express from v4 to v5 while maintaining all existing API endpoint signatures, status codes, and response formats.
- **FR-003**: System MUST upgrade Zod from v3 to v4 while maintaining identical validation behavior on all existing schemas.
- **FR-004**: System MUST upgrade bcrypt from v5 to v6 while ensuring existing password hashes remain valid and verifiable.
- **FR-005**: System MUST upgrade express-rate-limit from v7 to v8 while maintaining the same rate limiting behavior.
- **FR-006**: System MUST evaluate Nodemailer v8 license (EUPL-1.1) and either upgrade, remain on v6, or adopt an alternative — email functionality must be preserved.

**Frontend Runtime:**
- **FR-007**: System MUST upgrade React from v18 to v19 while preserving all component rendering, state management, and user interactions.
- **FR-008**: System MUST upgrade Vite from v6 to v8 while maintaining the same build output quality, code splitting, and asset handling.
- **FR-009**: System MUST upgrade Tailwind CSS from v3 to v4 while preserving the exact same visual appearance across all pages in both light and dark modes.
- **FR-010**: System MUST upgrade React Router from v6 to v7 while maintaining all route definitions, protected routes, and navigation behavior.
- **FR-011**: System MUST upgrade Recharts from v2 to v3 while preserving all chart rendering, tooltips, and interactive features.
- **FR-012**: System MUST upgrade Framer Motion from v11 to Motion v12 while preserving all animations, page transitions, and reduced-motion behavior.

**Toolchain:**
- **FR-013**: System MUST upgrade TypeScript from v5 to v6 in both frontend and backend with zero type errors.
- **FR-014**: System MUST migrate ESLint from v8 to v10 with flat config format in both frontend and backend.
- **FR-015**: System MUST upgrade Jest from v29 to v30 in the backend with all tests passing.
- **FR-016**: System MUST upgrade Vitest from v2 to v4 in the frontend.
- **FR-017**: All `@types/*` packages MUST be updated to match their corresponding runtime library versions.

**Infrastructure:**
- **FR-018**: Docker MUST use node:24-alpine base image for both frontend build and backend runtime.
- **FR-019**: Docker MUST keep postgres:16-alpine image (PostgreSQL major upgrade deferred to separate feature due to data directory incompatibility).
- **FR-020**: The full Docker stack (`docker-compose up --build`) MUST start successfully with all services healthy.

**Data Safety:**
- **FR-021**: ZERO existing database records may be lost, corrupted, or altered during the migration process.
- **FR-022**: All existing user sessions/tokens that are invalidated by the upgrade MUST be recoverable via re-login.

### Key Entities

- **Dependency**: A library or tool the project depends on — has a name, current version, target version, scope (frontend/backend/shared), and risk level (high/medium/low).
- **Migration Step**: A discrete upgrade action — has ordering, dependencies on other steps, rollback strategy, and validation criteria.
- **Breaking Change**: A known incompatibility between current and target version — has affected files, required code changes, and available automation (codemods).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm run build` succeeds with zero errors in the frontend (Vite 8 + React 19 + Tailwind 4 + TypeScript 6).
- **SC-002**: `npx tsc --noEmit` passes with zero errors in both frontend and backend.
- **SC-003**: `npm run test` passes with zero failures in the backend (Jest 30 + Prisma 7 + Express 5).
- **SC-004**: `npm run test` passes (or reports "no test files") in the frontend (Vitest 4).
- **SC-005**: `docker-compose up --build` starts all 3 containers (postgres:16, backend node:24, frontend nginx) and all reach healthy status.
- **SC-006**: All existing data (transactions, budgets, categories, users, recurring, investments) is present and correct after migration (PostgreSQL stays on v16).
- **SC-007**: Every page in the frontend renders identically in both light and dark mode compared to pre-migration (no visual regressions from Tailwind 4 migration).
- **SC-008**: All API endpoints respond with the same status codes and response shapes as pre-migration.
- **SC-009**: ESLint runs with zero errors using flat config in both frontend and backend.
- **SC-010**: No dependency has a known critical security vulnerability (verified via `npm audit`).

---

## Assumptions

- The project's existing PostgreSQL data is stored in a Docker volume that can be backed up before migration.
- PostgreSQL stays on v16 (major upgrade deferred — PG16 supported until Nov 2028). PG upgrade will be a separate feature.
- React 19's codemod tool handles the majority of migration automatically.
- Tailwind CSS v4's migration tool handles config conversion from JS to CSS-first format.
- TypeScript 6's `ts5to6` migration tool handles default config changes.
- The project does not use any of Express 4's removed APIs (`app.del()`, `res.send(body, status)` two-arg form).
- Prisma 7's `prisma db push` can sync against an existing Prisma 5-generated database without data loss.
- The Nodemailer license evaluation will result in a clear decision that does not block the overall migration.
- All major version upgrades have official migration guides and/or codemods available.
- The migration will be performed in a single development session with the ability to validate incrementally.

---

## Clarifications

### Session 2026-04-12

**Q1: PostgreSQL upgrade strategy?**
- **Decision**: Keep PostgreSQL on v16. Major PG version upgrades require `pg_dump/restore` or `pg_upgrade` — incompatible data directory formats between major versions. PG16 is supported until Nov 2028, so there's no urgency. Mixing this with 20+ other major library upgrades adds unnecessary risk. PostgreSQL migration will be a separate, isolated feature.
- **Impact**: FR-019 updated (keep PG16), SC-005/SC-006 updated, US5 acceptance scenario 2 updated, assumption corrected. Edge case about PG16→18 data compat is no longer relevant for this feature.
