# Contract: Target Version Matrix

**Feature**: 002-dependency-migration  
**Date**: 2026-04-12

---

## Infrastructure

| Component | Current | Target | Change Type |
|---|---|---|---|
| Node.js | 20 LTS | 24 LTS | MAJOR |
| PostgreSQL | 16 | 16 (stays) | NONE |
| Docker node image | node:20-alpine | node:24-alpine | MAJOR |

## Backend Dependencies

| Package | Current | Target | Change Type | Risk |
|---|---|---|---|---|
| @prisma/client | ^5.22.0 | ^7.2.0 | MAJOR | HIGH |
| prisma (dev) | ^5.22.0 | ^7.2.0 | MAJOR | HIGH |
| express | ^4.21.1 | ^5.2.1 | MAJOR | LOW |
| zod | ^3.23.8 | ^4.3.6 | MAJOR | MEDIUM |
| bcrypt | ^5.1.1 | ^6.0.0 | MAJOR | LOW |
| express-rate-limit | ^7.4.1 | ^8.3.2 | MAJOR | LOW |
| nodemailer | ^6.9.16 | ^6.9.16 (stays) | NONE | — |
| cors | ^2.8.5 | ^2.8.6 | PATCH | NONE |
| helmet | ^8.0.0 | ^8.1.0 | MINOR | NONE |
| jsonwebtoken | ^9.0.2 | ^9.0.3 | PATCH | NONE |
| cookie-parser | ^1.4.7 | ^1.4.7 | NONE | — |
| pdfkit | ^0.15.1 | ^0.18.0 | MINOR | NONE |
| swagger-jsdoc | ^6.2.8 | ^6.2.8 (stays) | NONE | — |
| swagger-ui-express | ^5.0.1 | ^5.0.1 | NONE | — |

### Backend Dev Dependencies

| Package | Current | Target | Change Type |
|---|---|---|---|
| typescript | ^5.6.3 | ^6.0.0 | MAJOR |
| eslint | ^8.57.1 | ^10.2.0 | MAJOR |
| @typescript-eslint/eslint-plugin | ^8.14.0 | ^8.58.1 | MINOR |
| @typescript-eslint/parser | ^8.14.0 | ^8.58.1 | MINOR |
| jest | ^29.7.0 | ^30.3.0 | MAJOR |
| ts-jest | ^29.2.5 | ^30.0.0 | MAJOR |
| supertest | ^7.0.0 | ^7.2.2 | MINOR |
| tsx | ^4.19.2 | ^4.21.0 | MINOR |
| prettier | ^3.4.1 | ^3.8.2 | MINOR |
| @types/node | ^22.9.0 | ^24.0.0 | MAJOR |
| @types/express | ^5.0.0 | ^5.0.0 | NONE |
| @types/bcrypt | ^5.0.2 | ^5.0.2 | NONE |
| @types/jest | ^29.5.14 | ^30.0.0 | MAJOR |
| @types/jsonwebtoken | ^9.0.7 | ^9.0.7 | NONE |
| @types/nodemailer | ^6.4.17 | ^6.4.17 (stays) | NONE |
| @types/cors | ^2.8.17 | ^2.8.17 | NONE |
| @types/cookie-parser | ^1.4.7 | ^1.4.7 | NONE |
| @types/supertest | ^6.0.2 | ^6.0.2 | NONE |
| @types/pdfkit | ^0.13.5 | ^0.13.5 | NONE |
| @types/swagger-jsdoc | ^6.0.4 | ^6.0.4 | NONE |
| @types/swagger-ui-express | ^4.1.7 | ^4.1.7 | NONE |

### New Backend Dependencies (Required by Prisma 7)

| Package | Version | Reason |
|---|---|---|
| @prisma/adapter-pg | ^7.2.0 | Driver adapter for PostgreSQL |
| pg | ^8.x | PostgreSQL client (used by adapter) |
| @types/pg | ^8.x | TypeScript types for pg |

## Frontend Dependencies

| Package | Current | Target | Change Type | Risk |
|---|---|---|---|---|
| react | ^18.3.1 | ^19.2.5 | MAJOR | MEDIUM |
| react-dom | ^18.3.1 | ^19.2.5 | MAJOR | MEDIUM |
| react-router-dom | ^6.28.0 | ^7.14.0 | MAJOR | LOW |
| recharts | ^2.13.3 | ^3.8.1 | MAJOR | MEDIUM |
| framer-motion | ^11.18.2 | REMOVE | — | — |
| motion (new) | ^12.38.0 | NEW | — | LOW |
| axios | ^1.15.0 | ^1.15.0 | NONE | — |
| react-hot-toast | ^2.6.0 | ^2.6.0 | NONE | — |
| react-icons | ^5.6.0 | ^5.6.0 | NONE | — |
| zustand | ^5.0.12 | ^5.0.12 | NONE | — |

### Frontend Dev Dependencies

| Package | Current | Target | Change Type |
|---|---|---|---|
| typescript | ^5.6.3 | ^6.0.0 | MAJOR |
| vite | ^6.0.1 | ^8.0.8 | MAJOR |
| @vitejs/plugin-react | ^4.3.4 | ^6.0.1 | MAJOR |
| tailwindcss | ^3.4.15 | ^4.2.2 | MAJOR |
| @tailwindcss/vite (new) | ^4.2.2 | NEW | — |
| eslint | ^8.57.1 | ^10.2.0 | MAJOR |
| @typescript-eslint/eslint-plugin | ^8.14.0 | ^8.58.1 | MINOR |
| @typescript-eslint/parser | ^8.14.0 | ^8.58.1 | MINOR |
| eslint-plugin-react-hooks | ^5.0.0 | ^7.0.1 | MAJOR |
| vitest | ^2.1.5 | ^4.1.4 | MAJOR |
| jsdom | ^25.0.1 | ^29.0.2 | MAJOR |
| @testing-library/jest-dom | ^6.6.3 | ^6.9.1 | MINOR |
| @testing-library/react | ^16.3.2 | ^16.3.2 | NONE |
| @types/react | ^18.3.12 | ^19.0.0 | MAJOR |
| @types/react-dom | ^18.3.1 | ^19.0.0 | MAJOR |
| autoprefixer | ^10.4.27 | REMOVE | — |
| postcss | ^8.5.9 | REMOVE | — |
| prettier | ^3.8.2 | ^3.8.2 | NONE |

### Packages Removed (Frontend)

| Package | Reason |
|---|---|
| framer-motion | Replaced by `motion` |
| postcss | Replaced by `@tailwindcss/vite` (no PostCSS needed) |
| autoprefixer | Tailwind 4 handles autoprefixing internally |
| postcss.config.js | No longer needed |
| tailwind.config.ts | Replaced by `@theme` in CSS |

## Total Migration Count

| Category | Count |
|---|---|
| Major upgrades | 18 |
| Minor/Patch upgrades | 12 |
| New packages | 4 |
| Removed packages | 4 |
| Unchanged | 16 |
| **Total changes** | **34** |
