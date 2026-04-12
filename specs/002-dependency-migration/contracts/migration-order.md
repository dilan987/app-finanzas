# Contract: Migration Execution Order

**Feature**: 002-dependency-migration  
**Date**: 2026-04-12

---

## Dependency Graph

Migration must follow this order due to inter-dependencies:

```
Phase 1: Backend Foundation (BLOCKING)
├── 1a: Backend ESM conversion (required by Prisma 7)
├── 1b: TypeScript 6 backend (required by ESM + Prisma 7)
└── 1c: Prisma 5 → 7 (requires ESM + TS6)

Phase 2: Backend Runtime
├── 2a: Express 4 → 5
├── 2b: Zod 3 → 4
├── 2c: bcrypt 5 → 6          [P] parallel
├── 2d: express-rate-limit 7→8 [P] parallel
├── 2e: Nodemailer decision     [P] parallel
├── 2f: Minor backend deps      [P] parallel
└── 2g: @types/* updates        [P] parallel

Phase 3: Backend Testing
├── 3a: Jest 29 → 30 + ts-jest ESM
└── 3b: Run + fix all backend tests

Phase 4: Frontend Foundation (BLOCKING)
├── 4a: TypeScript 6 frontend
├── 4b: Vite 6 → 7 → 8 + @vitejs/plugin-react 6
└── 4c: Tailwind CSS 3 → 4

Phase 5: Frontend Runtime
├── 5a: React 18 → 19 + @types/react 19   [P] parallel
├── 5b: React Router 6 → 7                 [P] parallel
├── 5c: Framer Motion 11 → Motion 12       [P] parallel
├── 5d: Recharts 2 → 3                     [P] parallel
└── 5e: Minor frontend deps                [P] parallel

Phase 6: Frontend Testing
├── 6a: Vitest 2 → 4 + jsdom 29
└── 6b: Run + fix frontend tests

Phase 7: Toolchain
├── 7a: ESLint 8 → 10 (backend flat config)
├── 7b: ESLint 10 (frontend flat config)
└── 7c: Lint script updates

Phase 8: Infrastructure & Validation
├── 8a: Docker base images (node:24-alpine)
├── 8b: docker-compose up --build
├── 8c: Full stack validation
└── 8d: Constitution update
```

## Phase Dependencies

| Phase | Depends On | Reason |
|---|---|---|
| Phase 1 | Nothing | Foundation — must go first |
| Phase 2 | Phase 1 | Express/Zod run on the ESM + Prisma 7 runtime |
| Phase 3 | Phase 1 + 2 | Tests must run against upgraded runtime |
| Phase 4 | Nothing* | Independent of backend, but TS6 knowledge from Phase 1 helps |
| Phase 5 | Phase 4 | React/Router/Motion need Vite 8 + Tailwind 4 build system |
| Phase 6 | Phase 4 + 5 | Tests must run against upgraded frontend runtime |
| Phase 7 | Phase 3 + 6 | Linting is last dev-tool step |
| Phase 8 | ALL | Final integration validation |

*Phase 4 CAN run in parallel with Phases 1-3 if desired.

## Rollback Strategy

Each phase has a clear rollback boundary:
- **Phase 1-3 (Backend)**: `git stash` or revert backend changes. Frontend is untouched.
- **Phase 4-6 (Frontend)**: `git stash` or revert frontend changes. Backend already stable.
- **Phase 7 (Toolchain)**: ESLint is dev-only. Can revert without affecting runtime.
- **Phase 8 (Docker)**: Revert Dockerfile base images.

## Validation Checkpoints

| After Phase | Validation Command | Expected |
|---|---|---|
| Phase 1 | `cd backend && npx tsc --noEmit` | 0 errors |
| Phase 2 | `cd backend && npm run dev` → hit `/api/health` | 200 OK |
| Phase 3 | `cd backend && npm run test` | All pass |
| Phase 4 | `cd frontend && npm run build` | Build succeeds |
| Phase 5 | `cd frontend && npm run build` + dev server manual test | Pages render correctly |
| Phase 6 | `cd frontend && npm run test` | Pass or "no test files" |
| Phase 7 | `npm run lint` in both | 0 errors |
| Phase 8 | `docker-compose up --build` → all healthy | 3 containers up, data intact |
