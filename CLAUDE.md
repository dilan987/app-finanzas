# Finanzas App - Development Guidelines

## Project Overview

Full-stack personal finance management application with dashboard, transactions, budgets, recurring transactions, investments, analytics, and reports.

## Tech Stack

- **Backend**: Node.js 20 LTS + Express.js 5 + TypeScript 6 + Prisma 6 ORM + PostgreSQL 16 + Zod 4
- **Frontend**: React 19 + TypeScript 6 + Vite 6 + Tailwind CSS 4 + Zustand + Recharts 3 + Motion 12 + React Router 7
- **Testing**: Jest 30 + Supertest (backend), Vitest 4 + React Testing Library (frontend)
- **Infrastructure**: Docker + Docker Compose

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Server bootstrap
│   ├── app.ts                # Express app setup
│   ├── config/               # env, database, swagger
│   ├── middlewares/           # auth, error, rateLimiter, validate
│   ├── modules/              # Feature modules (auth, users, categories, transactions, budgets, recurring, investments, analytics, reports)
│   │   └── <module>/
│   │       ├── <module>.controller.ts
│   │       ├── <module>.service.ts
│   │       ├── <module>.schema.ts
│   │       ├── <module>.routes.ts
│   │       └── <module>.test.ts
│   ├── utils/                # apiResponse, errors, helpers
│   └── types/
├── prisma/
│   ├── schema.prisma         # Database schema (9 models)
│   └── seed.ts

frontend/
├── src/
│   ├── api/                  # Axios API client layer (mirrors backend modules)
│   ├── components/           # ui/, layout/, charts/, forms/
│   ├── hooks/                # useAuth, useTransactions, useDebounce
│   ├── pages/                # 14 page components
│   ├── routes/               # AppRoutes, ProtectedRoute
│   ├── store/                # Zustand stores (auth, transaction, budget, ui)
│   ├── types/
│   └── utils/                # constants, formatCurrency, formatDate
```

## Key Commands

```bash
# Backend
cd backend && npm run dev           # Development server (port 4000)
cd backend && npm run test          # Run tests
cd backend && npm run prisma:migrate # Run migrations
cd backend && npm run prisma:generate # Generate Prisma client

# Frontend
cd frontend && npm run dev          # Dev server (port 5173)
cd frontend && npm run test         # Run tests
cd frontend && npm run build        # Production build

# Docker
docker-compose up --build           # Start full stack
```

## Code Style & Conventions

- camelCase for variables/functions, PascalCase for components/interfaces/models
- All API routes prefixed with `/api/`
- Standard response wrapper: `{ success, data, message, pagination }`
- Custom error classes from `backend/src/utils/errors.ts`
- Zod schemas for all input validation
- Dark/light mode support required (Tailwind CSS)

## SDD (Spec-Driven Development) Workflow

This project uses **Spec-Driven Development** powered by GitHub Spec Kit. All new features MUST follow this pipeline:

### Pipeline

1. **`/speckit.constitution`** - Define/update project principles (run once, update rarely)
2. **`/speckit.specify`** - Write feature specification (WHAT + WHY, no HOW)
3. **`/speckit.clarify`** - (Optional) Resolve ambiguities before planning
4. **`/speckit.plan`** - Generate technical implementation plan
5. **`/speckit.tasks`** - Break plan into ordered, actionable tasks
6. **`/speckit.analyze`** - (Optional) Cross-artifact consistency check
7. **`/speckit.checklist`** - (Optional) Generate quality validation checklist
8. **`/speckit.implement`** - Execute tasks according to the plan

### Key SDD Files

- `.specify/memory/constitution.md` - Project DNA (principles, stack, constraints)
- `.specify/templates/` - Templates for specs, plans, tasks, checklists
- `specs/` - Feature specifications (one directory per feature)
- `.specify/feature.json` - Current active feature pointer

### Rules

- **Specs define WHAT**, plans define HOW, tasks define ORDER
- Constitution is stable - it does NOT change per feature
- Every requirement MUST be testable and traceable
- No vibe coding: always specify before implementing

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
