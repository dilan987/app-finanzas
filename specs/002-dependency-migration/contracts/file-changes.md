# Contract: File Changes Map

**Feature**: 002-dependency-migration  
**Date**: 2026-04-12

---

## Backend Files

### Modified
| File | Changes |
|---|---|
| `backend/package.json` | Version bumps, add `"type": "module"`, add `@prisma/adapter-pg` + `pg` |
| `backend/tsconfig.json` | `module: nodenext`, `moduleResolution: nodenext`, `target: es2024` |
| `backend/prisma/schema.prisma` | Generator `prisma-client-js` → `prisma-client`, remove binaryTargets, remove datasource url |
| `backend/src/config/database.ts` | Prisma client init with `@prisma/adapter-pg` driver adapter |
| `backend/src/config/env.ts` | Zod 4 schema syntax updates |
| `backend/src/modules/*/\*.schema.ts` (9 files) | Zod 4 error handling updates |
| `backend/src/modules/*/\*.test.ts` (9 files) | Jest 30 + ESM compatibility |
| `backend/.eslintrc.json` | DELETE — replaced by eslint.config.js |
| `backend/Dockerfile` | `node:20-alpine` → `node:24-alpine` |

### New Files
| File | Purpose |
|---|---|
| `backend/prisma/prisma.config.ts` | Prisma 7 database configuration (replaces datasource in schema) |
| `backend/eslint.config.js` | ESLint 10 flat config |

### Deleted Files
| File | Reason |
|---|---|
| `backend/.eslintrc.json` | Replaced by eslint.config.js |

---

## Frontend Files

### Modified
| File | Changes |
|---|---|
| `frontend/package.json` | Version bumps, remove framer-motion/postcss/autoprefixer, add motion/@tailwindcss/vite |
| `frontend/tsconfig.json` | TypeScript 6 defaults |
| `frontend/vite.config.ts` | `@vitejs/plugin-react` v6, add `@tailwindcss/vite` plugin, remove PostCSS ref |
| `frontend/src/index.css` | Tailwind 4 `@import "tailwindcss"`, `@theme` block replaces JS config |
| `frontend/src/main.tsx` | React 19 compat (verify createRoot) |
| `frontend/src/components/ui/Input.tsx` | Remove forwardRef, ref as prop |
| `frontend/src/components/ui/Select.tsx` | Remove forwardRef, ref as prop |
| `frontend/src/components/ui/DatePicker.tsx` | Remove forwardRef, ref as prop |
| `frontend/src/components/charts/CategoryPieChart.tsx` | Recharts 3 API updates |
| `frontend/src/components/charts/TrendLineChart.tsx` | Recharts 3 API updates |
| `frontend/src/components/charts/IncomeExpenseBarChart.tsx` | Recharts 3 API updates |
| `frontend/src/components/charts/BudgetProgressList.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/components/layout/AuthLayout.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/components/layout/BottomTabBar.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/components/layout/MainLayout.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/components/layout/PageTransition.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/components/ui/Card.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/components/ui/Modal.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/components/ui/StatCard.tsx` | `framer-motion` → `motion/react` import |
| `frontend/src/routes/AppRoutes.tsx` | React Router 7 imports |
| ~18 files importing react-router-dom | Update imports to `react-router` |

### New Files
| File | Purpose |
|---|---|
| `frontend/eslint.config.js` | ESLint 10 flat config |

### Deleted Files
| File | Reason |
|---|---|
| `frontend/tailwind.config.ts` | Replaced by `@theme` in index.css |
| `frontend/postcss.config.js` | No longer needed (Tailwind Vite plugin) |

---

## Infrastructure Files

### Modified
| File | Changes |
|---|---|
| `docker-compose.yml` | Keep postgres:16-alpine (no change) |
| `backend/Dockerfile` | `FROM node:20-alpine` → `FROM node:24-alpine` |
| `frontend/Dockerfile` | `FROM node:20-alpine` → `FROM node:24-alpine` |

---

## Constitution File

### Modified
| File | Changes |
|---|---|
| `.specify/memory/constitution.md` | Update Tech Stack section with new versions |

---

## Total Impact

| Metric | Count |
|---|---|
| Files modified | ~50 |
| Files created | 3 |
| Files deleted | 3 |
| Backend modules touched | 9 (all) |
| Frontend components touched | ~20 |
