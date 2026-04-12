# Implementation Plan: Full-Stack Dependency Migration

**Branch**: `002-dependency-migration` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/002-dependency-migration/spec.md`

## Summary

Comprehensive upgrade of all project dependencies to their latest stable versions. 18 major version upgrades across frontend and backend, 12 minor/patch upgrades, 4 new packages, 4 removed packages. The migration is phased: backend first (Prisma 7 + ESM conversion is the highest-risk change), then frontend (Tailwind 4 config paradigm shift), then toolchain (ESLint 10 flat config), then Docker deployment validation. PostgreSQL stays on v16 (deferred). Nodemailer stays on v6 (license concern). Zero data loss guaranteed.

## Technical Context

**Language/Version**: TypeScript 5.6 → 6.0 (both frontend and backend)  
**Primary Dependencies**: Express 4→5, Prisma 5→7, Zod 3→4, React 18→19, Vite 6→8, Tailwind 3→4  
**Storage**: PostgreSQL 16 (unchanged)  
**Testing**: Jest 29→30 (backend), Vitest 2→4 (frontend)  
**Target Platform**: Docker (node:24-alpine + nginx:alpine + postgres:16-alpine)  
**Project Type**: web-service (Express) + SPA (React/Vite)  
**Performance Goals**: Build time should improve (Vite 8 Rolldown = 10-30x faster)  
**Constraints**: Zero data loss, visual parity, API backward compatibility  
**Scale/Scope**: ~50 files modified, 34 dependency changes, 8 phases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|---|---|---|---|
| I. Modular Architecture | Module structure preserved? | ✅ PASS | No structural changes |
| II. Type Safety | TypeScript strict mode? | ✅ PASS | TS6 defaults to strict (already enabled) |
| III. Validation at Boundaries | Zod schemas preserved? | ✅ PASS | Zod 4 migration preserves all schemas |
| IV. Security First | Auth/hashing unchanged? | ✅ PASS | bcrypt 6 backward-compat, JWT unchanged |
| V. Test Coverage | Tests pass after migration? | ✅ PASS | SC-003, SC-004 validate this |
| Dark/Light Mode | Visual parity? | ✅ PASS | SC-007 validates this |
| Docker Compose | Deployment works? | ✅ PASS | SC-005 validates this |

**Constitution Deviation**: Tech Stack section lists old versions — will be updated in Phase 8 after all migrations verified.

## Project Structure

### Documentation (this feature)

```text
specs/002-dependency-migration/
├── plan.md            ← This file
├── spec.md            ← Feature specification
├── research.md        ← 14 research decisions
├── data-model.md      ← No data changes
├── quickstart.md      ← 10 validation scenarios
├── contracts/
│   ├── migration-order.md   ← Phase dependency graph
│   ├── version-targets.md   ← Complete version matrix
│   └── file-changes.md      ← All files affected
├── checklists/
│   └── requirements.md      ← FR traceability
└── tasks.md           ← (next: /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/          ← database.ts (Prisma 7 driver adapter), env.ts (Zod 4)
│   ├── middlewares/      ← Unchanged
│   ├── modules/          ← All 9 modules: schema files (Zod 4), test files (Jest 30)
│   ├── utils/            ← Unchanged
│   └── types/            ← Unchanged
├── prisma/
│   ├── schema.prisma     ← Generator rename, remove datasource/binaryTargets
│   ├── prisma.config.ts  ← NEW: Prisma 7 datasource config
│   └── seed.ts           ← ESM import syntax
├── package.json          ← "type": "module", version bumps
├── tsconfig.json         ← module: nodenext
├── eslint.config.js      ← NEW: flat config (replaces .eslintrc.json)
└── Dockerfile            ← node:24-alpine

frontend/
├── src/
│   ├── components/       ← 8 files: motion import, 3 files: forwardRef removal
│   ├── pages/            ← Import path updates
│   ├── routes/           ← React Router 7 imports
│   ├── index.css         ← Tailwind 4 @theme + @import
│   └── main.tsx          ← React 19 createRoot (verify)
├── package.json          ← Version bumps, add motion, remove framer-motion/postcss
├── tsconfig.json         ← TS6 updates
├── vite.config.ts        ← Vite 8 + @tailwindcss/vite + plugin-react v6
├── eslint.config.js      ← NEW: flat config
└── Dockerfile            ← node:24-alpine
```

## Implementation Phases

### Phase 1: Backend Foundation (BLOCKING — highest risk)

**Goal**: Convert backend to ESM, upgrade TypeScript 6, upgrade Prisma 5→7.

**Why first**: Prisma 7 requires ESM. This is the most disruptive backend change and blocks all subsequent backend work.

**Steps**:
1. Add `"type": "module"` to `backend/package.json`
2. Update `backend/tsconfig.json`: `module: nodenext`, `moduleResolution: nodenext`, `target: es2024`
3. Upgrade `typescript` to `^6.0.0`
4. Install `@prisma/adapter-pg`, `pg`, `@types/pg`
5. Upgrade `prisma` and `@prisma/client` to `^7.2.0`
6. Update `schema.prisma`: generator `prisma-client` (rename), remove `binaryTargets`, remove `datasource` block
7. Create `prisma.config.ts` with PostgreSQL datasource config
8. Update `database.ts`: Initialize PrismaClient with `@prisma/adapter-pg` driver adapter
9. Run `npx prisma generate`
10. Run `npx tsc --noEmit` — fix any errors

**Checkpoint**: `npx tsc --noEmit` passes

### Phase 2: Backend Runtime Dependencies

**Goal**: Upgrade Express, Zod, bcrypt, and minor deps.

**Steps**:
1. Upgrade `express` to `^5.2.1`, `@types/express` verify compat
2. Upgrade `zod` to `^4.3.6` — update all `.schema.ts` files (errorMap callbacks)
3. Upgrade `bcrypt` to `^6.0.0`
4. Upgrade `express-rate-limit` to `^8.3.2` — update option names
5. Pin `nodemailer` to `^6.9.16` (stays — license concern)
6. Upgrade minor deps: `cors`, `helmet`, `jsonwebtoken`, `pdfkit`
7. Upgrade `@types/*` for changed packages
8. Run `npx tsc --noEmit` — fix any errors
9. Start dev server, test `/api/health` and login endpoint

**Checkpoint**: Backend starts and responds correctly

### Phase 3: Backend Testing

**Goal**: Upgrade Jest 29→30, fix all tests.

**Steps**:
1. Upgrade `jest` to `^30.3.0`, `ts-jest` to `^30.0.0`, `@types/jest` to `^30.0.0`
2. Update Jest config for ESM compatibility
3. Upgrade `supertest` to `^7.2.2`
4. Run `npm run test` — fix failures
5. Regenerate snapshots if any exist

**Checkpoint**: All 9 test modules pass

### Phase 4: Frontend Foundation (BLOCKING)

**Goal**: Upgrade TypeScript 6, Vite 6→8, Tailwind 3→4.

**Steps**:
1. Upgrade `typescript` to `^6.0.0`, update `tsconfig.json`
2. Upgrade `vite` to `^7.x` first (staged), then `^8.0.8`
3. Upgrade `@vitejs/plugin-react` to `^6.0.1`
4. Install `@tailwindcss/vite` ^4.2.2
5. Remove `postcss`, `autoprefixer`, and `postcss.config.js`
6. Run `npx @tailwindcss/upgrade` to migrate Tailwind config
7. Convert `tailwind.config.ts` → `@theme` block in `index.css`
8. Delete `tailwind.config.ts`
9. Update `vite.config.ts` with `@tailwindcss/vite` plugin
10. Run `npm run build` — fix errors
11. Visual check: dev server, light/dark mode, all pages

**Checkpoint**: `npm run build` succeeds, pages look correct

### Phase 5: Frontend Runtime Dependencies

**Goal**: Upgrade React, Router, Motion, Recharts.

**Steps**:
1. Upgrade `react` + `react-dom` to `^19.2.5`, `@types/react` + `@types/react-dom` to `^19.0.0`
2. Remove `forwardRef` from Input.tsx, Select.tsx, DatePicker.tsx — use ref as prop
3. Check all `useRef()` calls have argument
4. Upgrade `react-router-dom` to `^7.14.0` — update imports across ~20 files
5. Remove `framer-motion`, install `motion` ^12.38.0 — update 8 file imports to `motion/react`
6. Upgrade `recharts` to `^3.8.1` — update chart components
7. Upgrade minor deps: `@testing-library/jest-dom`
8. Run `npm run build` — fix errors
9. Visual check: animations, navigation, charts

**Checkpoint**: Build succeeds, all features work

### Phase 6: Frontend Testing

**Goal**: Upgrade Vitest 2→4, jsdom 25→29.

**Steps**:
1. Upgrade `vitest` to `^4.1.4`
2. Upgrade `jsdom` to `^29.0.2`
3. Run `npm run test` — fix failures or confirm "no test files"

**Checkpoint**: Tests pass or no test files

### Phase 7: Toolchain (ESLint)

**Goal**: Migrate ESLint 8→10 flat config in both codebases.

**Steps**:
1. Upgrade `eslint` to `^10.2.0` in both
2. Upgrade `eslint-plugin-react-hooks` to `^7.0.1`
3. Create `backend/eslint.config.js` (flat config)
4. Delete `backend/.eslintrc.json`
5. Create `frontend/eslint.config.js` (flat config)
6. Update lint scripts (remove `--ext` flag)
7. Run `npx eslint .` in both — fix errors

**Checkpoint**: Zero lint errors in both

### Phase 8: Infrastructure & Final Validation

**Goal**: Docker deployment, full stack validation, constitution update.

**Steps**:
1. Update `backend/Dockerfile`: `FROM node:20-alpine` → `FROM node:24-alpine`
2. Update `frontend/Dockerfile`: `FROM node:20-alpine` → `FROM node:24-alpine`
3. Run `docker-compose up --build` — verify all 3 containers start
4. Verify existing data (transactions, budgets) present and correct
5. Run all quickstart validation scenarios V1-V10
6. Run `npm audit` in both — verify no critical vulnerabilities
7. Update `.specify/memory/constitution.md` Tech Stack section
8. Update `specs/002-dependency-migration/tasks.md` — mark all complete

**Checkpoint**: All success criteria SC-001 through SC-010 pass

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Backend ESM conversion | Required by Prisma 7 (ESM-only) | Staying on CJS rejected because Prisma 7 doesn't support it |
| Staged Vite migration (6→7→8) | Official recommendation for safety | Direct 6→8 jump risks incompatible intermediate states |
| Tailwind config paradigm shift (JS→CSS) | Tailwind 4 removes JS config entirely | No simpler path exists — this is the required migration |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Prisma 7 ESM conversion breaks test suite | HIGH | HIGH | Phase 3 dedicated to fixing tests after ESM |
| Tailwind 4 class renames break visual | MEDIUM | HIGH | Migration tool + manual visual check on every page |
| Backend ESM import paths break at runtime | MEDIUM | MEDIUM | TypeScript `nodenext` resolution catches at compile time |
| Recharts 3 API changes break charts | LOW | MEDIUM | Only 4 chart components, limited API surface |
| Express 5 subtle behavior change | LOW | LOW | Codebase doesn't use any deprecated APIs |
