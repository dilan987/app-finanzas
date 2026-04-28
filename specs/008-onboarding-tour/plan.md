# Implementation Plan: Tour de Onboarding Interactivo

**Branch**: `008-onboarding-tour` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/008-onboarding-tour/spec.md`

## Summary

Añadir un tour guiado de bienvenida que se dispara automáticamente en el primer login del usuario y recorre las secciones clave de la app (Dashboard, Cuentas, Categorías, Transacciones, Presupuestos, Recurrentes, Metas, Inversiones, Analytics, Reportes) mediante tarjetas pequeñas ancladas a elementos reales de la UI con resaltado, navegación por teclado y persistencia de estado por usuario en backend.

**Enfoque técnico**:

- **Backend**: nuevo módulo `onboarding` (controller/service/schema/routes/test) que expone `GET /api/onboarding/tour` y `PATCH /api/onboarding/tour`. Persistencia mediante 3 columnas adicionales en `User` (`tourStatus`, `tourVersion`, `tourUpdatedAt`) más un nuevo enum `TourStatus` en `schema.prisma`. Migración Prisma.
- **Frontend**: implementación propia (sin librerías de terceros para el tour) sobre el stack ya presente. Posicionamiento con `@floating-ui/react` (librería pequeña, MIT, sin CVEs), animaciones con Motion 12 ya instalado, focus trap manual con `react-focus-lock`. Nuevo store Zustand `onboardingStore`, API client `api/onboarding.ts`, hook `useOnboardingTour`, componentes `TourProvider` / `TourCard` / `TourSpotlight`, configuración declarativa de pasos en `utils/tourSteps.ts`, atributos `data-tour` en elementos ancla existentes.

## Technical Context

**Language/Version**: TypeScript 6 (frontend y backend)
**Primary Dependencies**:
- Backend: Express.js 5, Prisma 6, Zod 4
- Frontend: React 19, Vite 6, Tailwind CSS 4, Motion 12, React Router 7, Zustand
- Nuevas (frontend): `@floating-ui/react` (positioning), `react-focus-lock` (focus trap)

**Storage**: PostgreSQL 16 vía Prisma. Cambios de schema: 3 columnas nuevas en `User` + 1 enum `TourStatus`.
**Testing**: Jest 30 + Supertest (backend), Vitest 4 + React Testing Library (frontend)
**Target Platform**: Web SPA + API Node.js (Docker Compose)
**Project Type**: web-service + SPA (modular)
**Performance Goals**:
- Tarjeta del tour aparece a <200 ms desde la transición de paso
- Sin retrasos perceptibles en navegación entre rutas durante el tour
- Tour completo carga su configuración estática en <50 KB gzip

**Constraints**:
- Cero vulnerabilidades: las dos nuevas dependencias (`@floating-ui/react`, `react-focus-lock`) deben pasar `npm audit` sin issues. Se valida antes de añadirlas (research.md).
- 100% TypeScript estricto, sin `any`.
- Soporte completo dark/light mode usando tokens Tailwind existentes.
- Idioma: español únicamente.
- Respeto de `prefers-reduced-motion`.
- WCAG AA en contraste y navegación.

**Scale/Scope**:
- Aproximadamente 11 pasos (10 secciones + cierre).
- 1 usuario = 1 estado de tour (no por dispositivo).
- Configuración declarativa en cliente; el backend solo persiste estado.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento |
|-----------|--------------|
| **I. Modular Architecture** | ✅ Nuevo módulo `backend/src/modules/onboarding/` con controller/service/schema/routes/test. |
| **II. Type Safety** | ✅ Tipos estrictos en backend (Zod + tipos derivados) y frontend (interfaces). Prisma genera el tipo del nuevo enum `TourStatus`. |
| **III. Validation at Boundaries** | ✅ Zod valida `PATCH /api/onboarding/tour` (status enum + version string). Wrapper estándar `ApiResponse`. |
| **IV. Security First** | ✅ Endpoints protegidos por middleware JWT existente. Endpoint solo opera sobre `req.user.id`, sin posibilidad de tocar otros usuarios. |
| **V. Zero-Vulnerability Dependencies** | ⚠️ Validar antes de instalar (`@floating-ui/react`, `react-focus-lock`) que no tienen CVEs abiertos. Plan: ejecutar `npm audit` en research/instalación. Si alguna falla → fallback a implementación interna sin esa lib. |
| **VI. Test Coverage** | ✅ Tests backend (estado por defecto, transiciones válidas/inválidas, aislamiento entre usuarios) y frontend (renderizado de pasos, navegación, persistencia, accesibilidad básica). |
| **VII. DRY & Standardized Code** | ✅ Reutiliza `apiResponse`, `errors`, `validate` middleware. Frontend reutiliza `useFormModal` no aplica aquí; nueva utilidad `tourSteps.ts` centraliza configuración de pasos. Sin duplicación de lógica de UI. |

**Resultado**: PASA. Único punto de atención (V) se mitiga en research.md y antes de instalar.

## Project Structure

### Documentation (this feature)

```text
specs/008-onboarding-tour/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── onboarding-api.md
├── checklists/
│   └── requirements.md
└── tasks.md           # generado por /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   ├── schema.prisma                       # + enum TourStatus, columnas User
│   └── migrations/<timestamp>_add_user_tour_state/
└── src/
    ├── modules/
    │   └── onboarding/                      # NUEVO
    │       ├── onboarding.controller.ts
    │       ├── onboarding.service.ts
    │       ├── onboarding.schema.ts
    │       ├── onboarding.routes.ts
    │       └── onboarding.test.ts
    └── app.ts                               # mount /api/onboarding

frontend/
├── src/
│   ├── api/
│   │   └── onboarding.ts                    # NUEVO (axios calls)
│   ├── components/
│   │   └── onboarding/                      # NUEVO
│   │       ├── TourProvider.tsx
│   │       ├── TourCard.tsx
│   │       ├── TourSpotlight.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   └── useOnboardingTour.ts             # NUEVO
│   ├── store/
│   │   └── onboardingStore.ts               # NUEVO
│   ├── utils/
│   │   └── tourSteps.ts                     # NUEVO (configuración declarativa)
│   ├── types/
│   │   └── onboarding.ts                    # NUEVO (TourStatus, TourStep)
│   ├── pages/
│   │   ├── DashboardPage.tsx                # añadir data-tour="dashboard-*"
│   │   ├── AccountsPage.tsx                 # añadir data-tour="accounts-*"
│   │   ├── CategoriesPage.tsx               # idem
│   │   ├── TransactionsPage.tsx             # idem
│   │   ├── BudgetsPage.tsx                  # idem
│   │   ├── RecurringPage.tsx                # idem
│   │   ├── GoalsPage.tsx                    # idem
│   │   ├── InvestmentsPage.tsx              # idem
│   │   ├── AnalyticsPage.tsx                # idem
│   │   ├── ReportsPage.tsx                  # idem
│   │   └── SettingsPage.tsx                 # botón "Reiniciar tour"
│   ├── components/layout/
│   │   ├── Sidebar.tsx                      # data-tour="sidebar-<section>"
│   │   └── BottomTabBar.tsx                 # idem para móvil
│   └── routes/
│       └── AppRoutes.tsx                    # montar TourProvider dentro de MainLayout
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Dos dependencias nuevas frontend (`@floating-ui/react`, `react-focus-lock`) | Posicionamiento robusto de tooltips ancorados (collision detection, flip, viewport awareness) y focus trap accesible son problemas resueltos por libs maduras y pequeñas; reimplementarlos sería ~500 líneas extra y bug-prone. | Implementación 100% manual: descartada porque el coste de mantenimiento y los bugs de accesibilidad/edge cases superan el riesgo de auditar dos libs sin CVEs activos. |
| 3 columnas nuevas en `User` en lugar de tabla `UserOnboarding` separada | Estado 1:1 con el usuario, sin historia ni cardinalidad, sin queries cruzadas previstas; añadir columnas evita un JOIN constante en login. | Tabla separada: descartada porque añade complejidad sin beneficio (no hay cardinalidad ni historial necesario en este release). |

## Phase 0 — Research

Ver [research.md](./research.md). Resuelve: (1) elección de librería de tour vs implementación propia, (2) verificación de CVEs de las dos libs frontend candidatas, (3) estrategia de focus trap, (4) estrategia de anclaje a elementos en otras rutas.

## Phase 1 — Design Artifacts

- [data-model.md](./data-model.md): cambios en Prisma schema + entidad de cliente `TourStep`.
- [contracts/onboarding-api.md](./contracts/onboarding-api.md): contratos REST de los dos endpoints.
- [quickstart.md](./quickstart.md): pasos para validar la feature manual y automáticamente.

## Re-evaluación Constitution Check post-diseño

Tras Phase 1 todos los gates siguen pasando. Pendiente única acción ejecutiva en `/speckit.implement`:

1. Ejecutar `npm audit` antes y después de instalar las dos libs nuevas; si surge cualquier vulnerabilidad → bloqueo y replan.
