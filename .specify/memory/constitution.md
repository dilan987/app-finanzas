<!-- Sync Impact Report
Version: 1.0.0 (initial)
Added: All sections (initial constitution)
Templates requiring updates: N/A (first version)
-->

# Finanzas App Constitution

## Core Principles

### I. Modular Architecture
Every backend feature MUST follow the module pattern: controller, service, schema, routes, and tests as separate files under `backend/src/modules/<module-name>/`. No business logic in controllers or route handlers. Controllers delegate to services, services contain business logic, schemas handle validation.

### II. Type Safety (NON-NEGOTIABLE)
100% TypeScript across frontend and backend. No `any` types unless explicitly justified. All API request/response payloads MUST have Zod schemas (backend) and TypeScript interfaces (frontend). Prisma-generated types MUST be used for database interactions.

### III. Validation at Boundaries
All user input MUST be validated with Zod schemas before reaching service layer. Frontend MUST validate forms before submission. API responses MUST follow the standard `ApiResponse` wrapper format (`success`, `data`, `message`, `pagination`).

### IV. Security First
JWT authentication with short-lived access tokens (15min) and long-lived refresh tokens (7d, httpOnly cookies). bcrypt with 12 salt rounds for password hashing. Rate limiting on sensitive endpoints. Helmet.js for security headers. CORS restricted to configured origin. Never log sensitive data (passwords, tokens, card numbers).

### V. Zero-Vulnerability Dependencies (NON-NEGOTIABLE)
No dependency with known security vulnerabilities may remain in the project. `npm audit` MUST report 0 vulnerabilities in both backend and frontend at all times. When a vulnerability is detected: (1) update the affected package to a patched version, or (2) if no patch exists, replace it with a secure alternative. Before adding any new dependency, verify it has no open CVEs or advisories. Run `npm audit` as part of CI/CD and block deployments on findings. Transitive dependency vulnerabilities MUST also be addressed (via overrides or upstream updates).

### VI. Test Coverage
Every module MUST have corresponding test files. Backend uses Jest + Supertest. Frontend uses Vitest + React Testing Library. Tests MUST cover happy path and critical error scenarios at minimum.

### VII. DRY & Standardized Code (NON-NEGOTIABLE)
Code MUST follow DRY (Don't Repeat Yourself) principles. Shared logic MUST be extracted into reusable utilities, helpers, or hooks — never duplicated across modules. Specifically: (1) Backend: common patterns (ownership verification, entity validation, pagination, balance operations, decimal serialization, date ranges) MUST use shared functions from `backend/src/utils/`. (2) Frontend: common UI patterns (modal state, delete confirmation, CRUD operations, list pagination) MUST use custom hooks from `frontend/src/hooks/`. (3) No function should exceed ~80 lines; break large functions into composable sub-functions. (4) All constants and magic strings MUST be centralized in dedicated constants files.

## Tech Stack

- **Backend**: Node.js 20 LTS, Express.js 5, TypeScript 6, Zod 4
- **Database**: PostgreSQL 16+ with Prisma 6 ORM
- **Frontend**: React 19, TypeScript 6, Vite 6, Tailwind CSS 4, Motion 12, React Router 7, Recharts 3
- **State Management**: Zustand (persisted to sessionStorage)
- **Authentication**: JWT (access + refresh tokens) + bcrypt 6
- **API Docs**: Swagger/OpenAPI 3.0 at `/api/docs`
- **Testing**: Jest 30 + Supertest (backend), Vitest 4 + React Testing Library (frontend)
- **Infrastructure**: Docker + Docker Compose
- **Linting**: ESLint + Prettier

## Architecture Rules

- Backend follows modular architecture: each feature is a self-contained module under `backend/src/modules/`
- Frontend uses pages + components + hooks + stores separation
- API client layer (`frontend/src/api/`) mirrors backend modules
- Zustand stores are minimal and focused (one per domain concern)
- React Router v7 with lazy-loaded pages for code splitting
- Prisma schema is the single source of truth for data models
- All database operations go through Prisma Client (no raw SQL unless justified)

## Conventions

- camelCase for variables, functions, and file names in TypeScript
- PascalCase for React components, TypeScript interfaces, and Prisma models
- snake_case for database columns (Prisma handles mapping)
- All API routes prefixed with `/api/`
- HTTP status codes follow REST conventions (200, 201, 400, 401, 403, 404, 500)
- Errors use custom error classes from `backend/src/utils/errors.ts`
- Currency formatting uses the project's `formatCurrency` utility
- Date formatting uses the project's `formatDate` utility

## Constraints

- Frontend MUST work with dark and light mode (Tailwind CSS)
- All financial amounts MUST use proper decimal handling
- User data MUST be scoped (users can only access their own data)
- Refresh tokens MUST be stored in httpOnly cookies, never in localStorage
- Docker Compose MUST be the primary deployment method
- No direct database access from frontend (all through API)

## Governance

- This constitution supersedes all other practices for this project
- Amendments require documentation in this file with version bump
- All new features MUST follow the SDD pipeline: Spec -> Plan -> Tasks -> Implement
- Any deviation from constitution principles MUST be documented and justified in the feature's plan.md

**Version**: 1.2.0 | **Ratified**: 2026-04-12 | **Last Amended**: 2026-04-27
