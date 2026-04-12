# Quickstart: Validation Scenarios

**Feature**: 002-dependency-migration  
**Date**: 2026-04-12

---

## V1: Backend TypeScript Compilation

```bash
cd backend && npx tsc --noEmit
```
**Expected**: 0 errors. Validates TypeScript 6 + ESM module resolution + Prisma 7 types.

---

## V2: Backend Test Suite

```bash
cd backend && npm run test
```
**Expected**: All 9 test modules pass. Validates Jest 30 + ts-jest ESM + Prisma 7 mocking + Express 5 + Zod 4.

---

## V3: Backend Dev Server

```bash
cd backend && npm run dev
# Then: curl http://localhost:4000/api/health
```
**Expected**: 200 OK. Validates Express 5 + Prisma 7 DB connection + Node.js 24 runtime.

---

## V4: Backend Auth Flow

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin"}'
```
**Expected**: 200 with JWT tokens. Validates bcrypt 6 hash compat + Zod 4 validation + Express 5 routing.

---

## V5: Frontend TypeScript Compilation

```bash
cd frontend && npx tsc --noEmit
```
**Expected**: 0 errors. Validates TypeScript 6 + React 19 types + Router 7 types.

---

## V6: Frontend Production Build

```bash
cd frontend && npm run build
```
**Expected**: Build succeeds with Vite 8 + Tailwind 4 + React 19 + TypeScript 6. No errors/warnings.

---

## V7: Frontend Visual Parity

```bash
cd frontend && npm run dev
# Open http://localhost:5173
```
**Manual check**:
1. Login page renders with split-screen layout
2. Dashboard shows greeting, stat cards, charts
3. Toggle dark/light mode — all colors correct
4. Navigate all pages via sidebar
5. Mobile view (320px) — bottom tab bar visible
6. Animations work (page transitions, card entrance)

---

## V8: Docker Full Stack

```bash
cd project-root && docker-compose up --build
# Wait for all containers to start
```
**Expected**: All 3 containers healthy. Then:
```bash
curl http://localhost:3000        # Frontend loads
curl http://localhost:4000/api/health  # Backend responds
# Login and verify existing data (transactions, budgets) present
```

---

## V9: ESLint Validation

```bash
cd backend && npx eslint .
cd frontend && npx eslint .
```
**Expected**: 0 errors in both. Validates ESLint 10 flat config.

---

## V10: Security Audit

```bash
cd backend && npm audit
cd frontend && npm audit
```
**Expected**: No critical vulnerabilities (SC-010).
