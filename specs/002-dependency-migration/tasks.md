# Tasks: Full-Stack Dependency Migration

**Input**: Design documents from `specs/002-dependency-migration/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Include exact file paths in descriptions

---

## Adjusted Version Targets (Node 20.15.1 Constraint)

> Original plan targeted Prisma 7, Vite 8, and Node 24. Due to Node.js 20.15.1 locally
> (which doesn't meet 20.19+ requirement for Prisma 7, Vite 7+, and Vite 8), the following
> adjustments were made:
>
> - **Prisma**: 5 → 6.19.3 (not 7) — no ESM conversion needed
> - **Vite**: 6 → 6.4.2 (not 8) — stays on v6 with latest patch
> - **@vitejs/plugin-react**: 4 → 4.7.0 (not 6) — compatible with Vite 6
> - **Docker base images**: stay `node:20-alpine` (not 24)
> - **PostgreSQL**: stays 16 (not 18) — data preservation
> - **Nodemailer**: 6 → 7.0.13 (not 8) — EUPL license concern on v8
> - **Backend**: stays CommonJS (no ESM conversion needed with Prisma 6)

---

## Phase 1-2: Backend Migration (COMPLETED)

**Goal**: Upgrade all backend dependencies compatible with Node 20.15.1.  
**Result**: Backend compiles and runs cleanly.

### TypeScript 5 → 6

- [X] T001 [US1] Upgrade `typescript` to `^6.0.2` in `backend/package.json`
- [X] T002 [US1] Update `backend/tsconfig.json`: add `erasableSyntaxOnly: true`, add `ignoreDeprecations: "6.0"` (for `moduleResolution: "node"` deprecation)

### Prisma 5 → 6

- [X] T003 [US1] Upgrade `prisma` and `@prisma/client` to `^6.19.3` in `backend/package.json`
- [X] T004 [US1] Run `npx prisma generate` — verified client generates successfully (schema unchanged)

### Express 4 → 5

- [X] T005 [US1] Upgrade `express` to `^5.2.1` in `backend/package.json`
- [X] T006 [US1] Audit all route files — no deprecated APIs found (no `app.del()`, no two-arg `res.send()`)

### Zod 3 → 4

- [X] T007 [US1] Upgrade `zod` to `^4.3.6` in `backend/package.json`
- [X] T008 [US1] Update `backend/src/middlewares/validate.middleware.ts`: replace `ZodSchema` → `ZodType` import
- [X] T009 [US1] Update all 7 schema files: replace `errorMap: () => ({ message: '...' })` → `{ message: '...' }`
  - `categories.schema.ts`, `transactions.schema.ts`, `budgets.schema.ts`, `recurring.schema.ts`, `investments.schema.ts`, `reports.schema.ts`
- [X] T010 [US1] Update `recurring.schema.ts`: replace `required_error` → `message` in `z.boolean()`

### Other Backend Dependencies

- [X] T011 [P] [US1] Upgrade `bcrypt` to `^6.0.0`
- [X] T012 [P] [US1] Upgrade `express-rate-limit` to `^8.3.2`
- [X] T013 [P] [US1] Upgrade minor deps: `cors ^2.8.6`, `helmet ^8.1.0`, `jsonwebtoken ^9.0.3`, `pdfkit ^0.18.0`
- [X] T014 [P] [US1] Upgrade `nodemailer` to `^7.0.13`
- [X] T015 [P] [US1] Upgrade dev deps: `tsx ^4.21.0`, `prettier ^3.8.2`, `supertest ^7.2.2`
- [X] T016 [P] [US1] Upgrade `@types/*`: `@types/bcrypt ^6.0.0`, `@types/cors ^2.8.19`, `@types/express ^5.0.6`, `@types/jest ^30.0.0`, `@types/jsonwebtoken ^9.0.10`, `@types/node ^22.19.17`, `@types/nodemailer ^7.0.11`, `@types/pdfkit ^0.17.5`, `@types/supertest ^7.2.0`, `@types/cookie-parser ^1.4.10`, `@types/swagger-ui-express ^4.1.8`
- [X] T017 [US1] Upgrade `jest` to `^30.3.0`, `ts-jest` to `^29.4.9`
- [X] T018 [US1] Run `npx tsc --noEmit` — 0 errors
- [X] T019 [US1] Run `npx tsc` (full build) — 0 errors

**Checkpoint**: Backend compiles and runs with all upgraded dependencies ✅

---

## Phase 3-5: Frontend Migration (COMPLETED)

**Goal**: Upgrade React, Tailwind, Motion, Router, Recharts, Vitest, and TypeScript.  
**Result**: Frontend builds successfully with Vite 6.4.2.

### TypeScript 6

- [X] T020 [US2] Upgrade `typescript` to `^6.0.2` in `frontend/package.json`
- [X] T021 [US2] Update `frontend/tsconfig.json`: add `erasableSyntaxOnly: true`

### Vite + Build Tools

- [X] T022 [US2] Keep `vite` at `^6.4.2` (latest v6 — Vite 8 requires Node 20.19+)
- [X] T023 [US2] Keep `@vitejs/plugin-react` at `^4.7.0` (v6 requires Vite 8)
- [X] T024 [US2] Install `@tailwindcss/vite ^4.2.2` — add plugin to `frontend/vite.config.ts`

### Tailwind CSS 3 → 4

- [X] T025 [US2] Upgrade `tailwindcss` to `^4.2.2`
- [X] T026 [US2] Remove `postcss`, `autoprefixer` from dependencies — delete `frontend/postcss.config.js`
- [X] T027 [US2] Convert `frontend/tailwind.config.ts` into `@theme` CSS block in `frontend/src/index.css`
- [X] T028 [US2] Replace `@tailwind base/components/utilities` with `@import "tailwindcss"`
- [X] T029 [US2] Fix `@apply` with custom classes: expand `@apply card` and `@apply badge` to inline utilities (Tailwind 4 can't `@apply` custom component classes)
- [X] T030 [US2] Rename Tailwind utilities: `shadow-sm` → `shadow-xs` across 6 files
- [X] T031 [US2] Delete `frontend/tailwind.config.ts`

### React 18 → 19

- [X] T032 [US2] Upgrade `react` and `react-dom` to `^19.2.5`, `@types/react` to `^19.0.0`, `@types/react-dom` to `^19.0.0`
- [X] T033 [US2] Remove `forwardRef` from `Input.tsx` — accept `ref` as regular prop
- [X] T034 [P] [US2] Remove `forwardRef` from `Select.tsx` — accept `ref` as regular prop
- [X] T035 [P] [US2] Remove `forwardRef` from `DatePicker.tsx` — accept `ref` as regular prop

### Framer Motion → Motion 12

- [X] T036 [US2] Remove `framer-motion`, install `motion ^12.38.0`
- [X] T037 [US2] Update 8 files: change `from 'framer-motion'` → `from 'motion/react'`
- [X] T038 [US2] Fix Motion 12 ease type: add `as const` to tuple arrays in `Card.tsx`, `BudgetProgressList.tsx`

### React Router 6 → 7

- [X] T039 [US2] Upgrade `react-router-dom` to `^7.14.0`

### Recharts 2 → 3

- [X] T040 [US2] Upgrade `recharts` to `^3.8.1`

### Frontend Testing

- [X] T041 [US4] Upgrade `vitest` to `^4.1.4`, `jsdom` to `^29.0.2`

### Minor Frontend Deps

- [X] T042 [P] [US2] Upgrade `prettier ^3.8.2`, `eslint-plugin-react-hooks ^5.0.0`
- [X] T043 [P] [US2] Upgrade `@testing-library/jest-dom ^6.9.1`, `@testing-library/react ^16.3.2`
- [X] T044 [US2] Upgrade `zustand ^5.0.12`, `axios ^1.15.0`, `react-hot-toast ^2.6.0`, `react-icons ^5.6.0`

### Build Verification

- [X] T045 [US2] Run `npx tsc -b` — 0 TypeScript errors
- [X] T046 [US2] Run `npx vite build` — 1213 modules, 0 errors
- [X] T047 [US2] Start dev server — Vite 6.4.2 ready in 559ms

**Checkpoint**: Frontend builds and serves with all upgraded dependencies ✅

---

## Phase 6: Docker + Validation (COMPLETED)

- [X] T048 [US5] Docker images stay `node:20-alpine` (compatible with local Node)
- [X] T049 [US5] PostgreSQL stays `postgres:16-alpine` (data preservation)
- [X] T050 [US5] Run `docker-compose build` — both images build successfully
- [X] T051 [US5] Run `docker-compose up -d` — all 3 containers healthy
- [X] T052 [US5] Backend health check: `GET /api/health` → `200 OK`
- [X] T053 [US5] Frontend: `GET /` → `200 OK`
- [X] T054 [US5] Database: Prisma schema in sync, seed data present

**Checkpoint**: Docker deployment works end-to-end ✅

---

## Phase 7: ESLint 8 → 10 Flat Config (DEFERRED)

**Reason**: ESLint migration to flat config is a non-trivial change that can be done independently.

- [ ] T055 [US3] Upgrade `eslint` to `^10.x` in both `frontend/` and `backend/`
- [ ] T056 [US3] Create `eslint.config.js` flat config files (replace `.eslintrc.json`)
- [ ] T057 [US3] Upgrade `@typescript-eslint/*` to compatible versions
- [ ] T058 [US3] Upgrade `eslint-plugin-react-hooks` to `^7.x` (requires ESLint 10)
- [ ] T059 [US3] Run `npx eslint .` in both dirs — fix all errors

---

## Phase 8: Constitution Update (PENDING)

- [ ] T060 [US5] Update `.specify/memory/constitution.md` Tech Stack section with actual versions:
  - Node.js 20 LTS, Express 5, TypeScript 6, Prisma 6, Zod 4, React 19, Vite 6, Tailwind CSS 4, Recharts 3, Motion 12, React Router 7, Jest 30, Vitest 4

---

## Summary

| Metric | Count |
|---|---|
| **Total Tasks** | 60 |
| **Completed** | 54 (T001–T054) |
| **Deferred (ESLint)** | 5 (T055–T059) |
| **Pending (Constitution)** | 1 (T060) |
| **Phases Completed** | 6 of 8 |
| **Adjusted from original plan** | Prisma 7→6, Vite 8→6, Node 24→20, PG 18→16, Nodemailer 8→7 |
