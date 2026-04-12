# Research: Full-Stack Dependency Migration

**Feature**: 002-dependency-migration  
**Date**: 2026-04-12

---

## R1: Prisma 5 → 7 Migration Strategy

**Decision**: Upgrade via Prisma 6 intermediate step is NOT required — Prisma 7 migration guide supports direct 5→7 upgrade.

**Key Breaking Changes**:
1. **ESM-only module**: `@prisma/client` is now ESM-only. Backend uses `module: commonjs` in tsconfig — must switch to ESM or use dynamic `import()`.
   - **Resolution**: Backend tsconfig must change `module` to `nodenext` / `esnext`, package.json needs `"type": "module"`. All imports use ESM syntax (already the case with TypeScript).
2. **Generator rename**: `prisma-client-js` → `prisma-client` in schema.prisma.
3. **Driver adapters required**: Prisma 7 requires explicit driver adapter for all databases. Must install `@prisma/adapter-pg` and `pg` packages.
4. **`prisma.config.ts` replaces datasource in schema**: Database URL configuration moves from `schema.prisma` to `prisma.config.ts`.
5. **Binary targets removed**: No longer needed in generator block (replaced by driver adapters).
6. **Mapped enum values**: Enum values that map to different DB values may behave differently.

**Rationale**: Prisma 7 is a major architectural shift (ESM-only, driver adapters). This is the highest-risk backend migration but necessary for long-term support.

**Alternatives Rejected**:
- Stay on Prisma 5: Still supported but approaching EOL. Better to migrate now.
- Prisma 6 intermediate: Not needed per official upgrade guide.

---

## R2: Express 4 → 5 Migration Strategy

**Decision**: Direct upgrade. Codebase audit shows no usage of removed APIs.

**Key Breaking Changes**:
1. `app.del()` removed → use `app.delete()`. **Status**: Not used in codebase. ✅
2. `res.send(body, status)` two-arg form removed → use `res.status(n).send(body)`. **Status**: Not used — only single-arg `res.send(buffer)` found in reports controller. ✅
3. Route parameters have null prototype objects. **Status**: No impact — we use standard destructuring.
4. Wildcard captures returned as arrays. **Status**: No wildcard routes found. ✅
5. `dotfiles` default changed to `"ignore"` in `express.static`. **Status**: No static file serving in backend. ✅
6. Promise-returning route handlers are automatically caught (no need for try/catch wrappers). **Status**: Beneficial — simplifies error handling.

**Rationale**: The codebase is clean and doesn't use any deprecated Express 4 APIs. Direct upgrade is low-risk.

---

## R3: Zod 3 → 4 Migration Strategy

**Decision**: Use `@zod/codemod` for automated migration, then manual review.

**Key Breaking Changes**:
1. **Error customization**: `{ message: '...' }` option still works in Zod 4 for most methods, but `errorMap` callbacks have changed signature.
   - **Status**: `errorMap` used in transaction/budget schemas — needs manual update.
2. **`.strict()` / `.passthrough()`**: Replaced by `z.strictObject()` / `z.looseObject()`. **Status**: Not used. ✅
3. **Coercion input types**: Changed to `unknown`. **Status**: `z.coerce` used — verify behavior.
4. **`.email()` / `.url()` deprecated**: Still work but flagged. Can migrate to `z.email()` / `z.url()` standalone.

**Rationale**: Codemod handles most changes. Manual review needed for `errorMap` callbacks in ~3 schema files.

---

## R4: Tailwind CSS 3 → 4 Migration Strategy

**Decision**: Use official `@tailwindcss/upgrade` CLI tool, then manual fixup for custom design system.

**Key Breaking Changes**:
1. **Config format**: JS config (`tailwind.config.ts`) → CSS-first `@theme` in `index.css`. The migration tool handles this.
2. **PostCSS plugin**: `tailwindcss` → `@tailwindcss/postcss`. Must update `postcss.config.js`.
3. **Vite plugin alternative**: `@tailwindcss/vite` is available and faster than PostCSS. Preferred for Vite projects.
4. **Utility renames**: `shadow` → `shadow-sm`, `rounded` → `rounded-sm`, `blur` → `blur-sm`, `ring` → `ring-3`, etc. Migration tool auto-renames.
5. **Default border color**: Changed from `gray-200` to `currentColor`. Must verify borders.
6. **`@tailwind` directives**: Replaced by `@import "tailwindcss"`.
7. **Dark mode**: `darkMode: 'class'` is now default. Our CSS custom properties approach should still work.
8. **Custom theme**: Our extensive `theme.extend` in JS config must be converted to `@theme` CSS block.

**Critical Risk**: Dynamic Tailwind classes in template literals (found in 10+ files). The migration tool handles static classes in source files, but our ternary patterns like `${condition ? 'text-income' : 'text-expense'}` should survive IF the class names themselves don't change. Our custom token names (text-income, text-expense, bg-surface-card, etc.) are NOT renamed by Tailwind 4 — only default utility names change.

**Rationale**: The `@tailwindcss/upgrade` tool handles most migration automatically. Custom design tokens survive because they're custom names not affected by Tailwind's renames. Main work is converting `tailwind.config.ts` to `@theme` CSS blocks.

---

## R5: React 18 → 19 Migration Strategy

**Decision**: Use React 19 codemod, then manual fixup for forwardRef removal.

**Key Breaking Changes**:
1. **`forwardRef` no longer needed**: `ref` is passed as a regular prop. **Status**: Used in 3 components (Input, Select, DatePicker) — simple refactor.
2. **`ReactDOM.render` removed**: Must use `createRoot`. **Status**: Already using `createRoot` (React 18 pattern). ✅
3. **`defaultProps` removed for function components**: **Status**: Not used. ✅
4. **`PropTypes` removed**: **Status**: Not used (TypeScript project). ✅
5. **Context changes**: `<Context.Provider>` → `<Context>`. **Status**: We use Zustand, not React Context providers. ✅
6. **`useRef()` requires argument**: `useRef()` → `useRef(null)`. **Status**: Need to check all useRef calls.
7. **Cleanup functions in refs**: Ref callbacks can return cleanup functions. Non-breaking.

**Rationale**: Very low-risk migration. Only 3 files need forwardRef refactoring. Already on React 18 createRoot pattern.

---

## R6: Vite 6 → 8 Migration Strategy (Staged: 6→7→8)

**Decision**: Staged migration through Vite 7 first, then Vite 8. Official docs recommend this approach.

**Key Changes**:
1. **Vite 7**: Intermediate version. Drops Node.js 18 support (we're going to 24). Removes some deprecated APIs.
2. **Vite 8**: Rolldown replaces esbuild+Rollup (10-30x faster). Lightning CSS for minification. CJS interop changes.
3. **`@vitejs/plugin-react`**: Must upgrade to v6 (uses Oxc instead of Babel). No longer requires Babel.
4. **Config**: Our minimal `vite.config.ts` (plugin + proxy) should work with minimal changes.

**Rationale**: Staged approach reduces risk. Each step has clear validation (build + dev server).

---

## R7: React Router 6 → 7 Migration Strategy

**Decision**: Enable future flags in v6 first, then upgrade to v7.

**Key Changes**:
1. **Package consolidation**: `react-router-dom` → `react-router`. Can still import from `react-router-dom` (re-exports).
2. **`BrowserRouter`**: Still available from `react-router/dom` or `react-router-dom`.
3. **All symbols we use** (`NavLink`, `Outlet`, `useNavigate`, `useLocation`, `Link`, `useParams`, `useSearchParams`, `Routes`, `Route`, `Navigate`) are all available in v7.

**Rationale**: Our usage is standard — no advanced features like data routers or loaders. Straightforward upgrade.

---

## R8: Framer Motion 11 → Motion 12 Migration Strategy

**Decision**: Direct upgrade. Rebrand import path change.

**Key Changes**:
1. **Package**: `framer-motion` → `motion`. Install `motion` package, uninstall `framer-motion`.
2. **Import path**: `from 'framer-motion'` → `from 'motion/react'`.
3. **API**: `motion` and `AnimatePresence` APIs are identical. No functional changes.
4. **8 files** need import path updates.

**Rationale**: Pure rebranding. No functional changes. Simple find-and-replace.

---

## R9: TypeScript 5 → 6 Migration Strategy

**Decision**: Use `ts5to6` migration tool, then adjust configs.

**Key Changes**:
1. **`strict: true`** now default — already enabled in both tsconfigs. ✅
2. **`module` defaults to `esnext`** — frontend already uses ESNext, backend needs change (commonjs → nodenext for Prisma 7 ESM).
3. **`target` defaults to `es2025`** — both currently lower (ES2020/ES2022), can update.
4. **`moduleResolution: classic` removed** — not used. ✅
5. **`esModuleInterop` always enabled** — already enabled. ✅

**Rationale**: Both tsconfigs are already modern. Minimal changes needed.

---

## R10: ESLint 8 → 10 Flat Config Migration

**Decision**: Create new `eslint.config.js` files for both frontend and backend. Delete `.eslintrc.json`.

**Key Changes**:
1. **Legacy `.eslintrc` removed entirely** in ESLint 10.
2. **Flat config format**: Array of config objects in `eslint.config.js`.
3. **Frontend**: No existing ESLint config found — create fresh flat config.
4. **Backend**: `.eslintrc.json` exists — must convert to flat config.
5. **`eslint-plugin-react-hooks`**: Upgrade to v7 for React 19 compatibility.
6. **Lint script**: Remove `--ext` flag (no longer needed in flat config).

**Rationale**: Clean break to flat config. Both codebases need config files created/rewritten.

---

## R11: Jest 29 → 30 Migration

**Decision**: Direct upgrade with snapshot regeneration.

**Key Changes**:
1. **jsdom 21→26**: Internal upgrade, may affect DOM mocking patterns.
2. **`jest.mock()` case-sensitive**: Already the case in our codebase. ✅
3. **Snapshot format changed**: Must regenerate all snapshots. **Status**: No snapshot tests found in backend. ✅
4. **`--testPathPattern` → `--testPathPatterns`**: Not used in scripts. ✅
5. **`ts-jest`**: Must also upgrade to compatible version (29.x → 30.x).

**Rationale**: Low-risk. No snapshots to regenerate. Main concern is ts-jest compatibility.

---

## R12: Nodemailer 6 → 8 License Assessment

**Decision**: Stay on Nodemailer 6 (last MIT version). Pin to `^6.9.16`.

**Rationale**: 
- Nodemailer 8 changed license from MIT to EUPL-1.1.
- EUPL-1.1 is a copyleft license — requires derivative works to be released under compatible licenses.
- For a personal finance app, this is unnecessarily restrictive.
- Nodemailer 6 is fully functional for our SMTP use case.
- If Nodemailer 6 becomes unmaintained, alternatives like `@sendgrid/mail` or `resend` are available.

**Alternatives Considered**:
- Upgrade to Nodemailer 8: Rejected due to license change.
- Switch to Resend/SendGrid: Not needed — current functionality is sufficient.

---

## R13: Node.js 20 → 24 LTS

**Decision**: Upgrade Docker base images to `node:24-alpine`.

**Key Changes**:
1. **OpenSSL 3.5**: Security level 2 (min 2048-bit RSA/DSA/DH keys). No impact — we use standard JWT/bcrypt.
2. **`import assert` → `with` attribute**: TypeScript handles this via compilation.
3. **`url.parse()` deprecated**: Check if used. Prisma connection string uses standard URL format.
4. **npm 11**: Available in node:24-alpine. Lockfile format compatible.

**Rationale**: Node.js 24 is current LTS. Alpine image keeps Docker images small.

---

## R14: Backend ESM Migration (Required by Prisma 7)

**Decision**: Convert backend from CommonJS to ESM.

**Key Changes**:
1. Add `"type": "module"` to backend `package.json`.
2. Change `tsconfig.json` module from `commonjs` to `nodenext`.
3. All relative imports need `.js` extensions in compiled output (TypeScript handles this with `moduleResolution: nodenext`).
4. `__dirname` / `__filename` not available in ESM — use `import.meta.url`. Check if used.
5. Jest needs ESM-compatible configuration (`ts-jest` with ESM support or `jest.config.ts` with `extensionsToTreatAsEsm`).

**Rationale**: Required by Prisma 7. Also aligns with modern Node.js best practices.

**Risk**: This is the highest-risk backend change — affects every import statement and test configuration.
