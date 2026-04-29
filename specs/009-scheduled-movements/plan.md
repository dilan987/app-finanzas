# Implementation Plan: Movimientos Programados y Proyección por Quincena

**Branch**: `009-scheduled-movements` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-scheduled-movements/spec.md`

## Summary

Extender el módulo `recurring/` para soportar la frecuencia `ONCE` (una sola ejecución) y exponer un nuevo endpoint de proyección de cash flow por quincena. En frontend renombrar la sección "Recurrentes" → "Movimientos programados", añadir filtros por tipo (Todos / Repetitivos / Puntuales), incorporar `ONCE` en el formulario, y crear una vista timeline quincenal en `BudgetsPage` que consume el nuevo endpoint.

**Enfoque técnico**:

- **Backend**:
  - Añadir `ONCE` al enum `Frequency` (Prisma + Zod schemas).
  - En `processRecurring()`: si frecuencia es `ONCE`, marcar `isActive=false` tras ejecutar (sin recalcular `nextExecutionDate`).
  - Nuevo endpoint `GET /api/recurring/projection?month=&year=` que devuelve la proyección agrupada por quincena, listando los movimientos activos cuya `nextExecutionDate` cae en el mes solicitado. Para movimientos con frecuencias repetitivas se proyecta también la(s) ocurrencia(s) que caigan dentro del mes (se itera `calculateNextExecutionDate` desde `nextExecutionDate` hasta que se sale del mes).
  - Tests del módulo `recurring` cubren la nueva frecuencia y el nuevo endpoint.

- **Frontend**:
  - `FREQUENCIES` añade `{ value: 'ONCE', label: 'Solo una vez' }`.
  - `RecurringPage` se renombra visualmente a "Movimientos programados", añade tabs/filtros (Todos / Repetitivos / Puntuales).
  - Sidebar y `BottomTabBar` actualizan label.
  - Form: cuando se selecciona `ONCE`, sólo cambia el placeholder/hint del campo de fecha (que ya existe); no se necesita selector distinto.
  - `BudgetsPage`: nueva sección "Proyección por quincena" debajo del resumen actual, con dos columnas/cards (Q1, Q2) que consumen el nuevo endpoint.

## Technical Context

**Language/Version**: TypeScript 6 (frontend y backend)

**Primary Dependencies**:
- Backend: Express.js 5, Prisma 6, Zod 4 (sin nuevas)
- Frontend: React 19, Vite 6, Tailwind CSS 4, Motion 12 (sin nuevas)

**Storage**: PostgreSQL 16 vía Prisma. Único cambio de schema: añadir `ONCE` al enum `Frequency`.

**Testing**: Jest 30 + Supertest (backend), Vitest 4 + React Testing Library (frontend)

**Target Platform**: Web SPA + API Node.js (Docker Compose)

**Project Type**: web-service + SPA (modular)

**Performance Goals**:
- Endpoint de proyección quincenal responde en <200 ms para usuarios con hasta 100 movimientos programados.
- La vista timeline renderiza <100 ms en cliente para hasta 30 movimientos por quincena.

**Constraints**:
- Cero migración destructiva: ningún registro existente cambia.
- Compatibilidad total con `processRecurring` existente: las frecuencias actuales mantienen su comportamiento.
- Idioma: español único.
- 100% TypeScript estricto, sin `any`.
- Soporte dark/light usando tokens existentes.

**Scale/Scope**:
- ~1 endpoint nuevo, ~1 migración trivial de enum, ~150 líneas backend nuevas.
- ~1 página renombrada, ~1 vista nueva (`BiweeklyTimeline`), ~50 líneas en form.

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| **I. Modular Architecture** | ✅ Cambios contenidos en módulos `recurring/` y `analytics/budgets/` (este último para exponer la vista derivada) o en `recurring/` mismo. Decisión: vivir en `recurring/projection.service.ts` (sub-archivo) para mantener cohesión. |
| **II. Type Safety** | ✅ Tipos Prisma se regeneran tras añadir `ONCE`. Tipos derivados de Zod en backend; interfaces TS en frontend. |
| **III. Validation at Boundaries** | ✅ Zod valida el query del nuevo endpoint (`month`, `year`); el form de creación valida la frecuencia. |
| **IV. Security First** | ✅ Endpoints detrás de `authMiddleware`; queries siempre filtran por `userId`. |
| **V. Zero-Vulnerability Dependencies** | ✅ No se añaden dependencias. `npm audit` ya en 0; se reverifica antes y después. |
| **VI. Test Coverage** | ✅ Backend: tests para `ONCE` (creación, ejecución → desactivación), tests de proyección. Frontend: test de la vista timeline (suma neta) y del filtro tabs. |
| **VII. DRY & Standardized** | ✅ La función `calculateNextExecutionDate` ya existe; se reutiliza para la iteración de proyecciones. `FREQUENCIES` centralizado. Tabs/filtros aprovechan componentes UI existentes. |

**Resultado**: PASA. Sin desviaciones que requieran justificación.

## Project Structure

### Documentation (this feature)

```text
specs/009-scheduled-movements/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── projection-api.md
├── checklists/
│   └── requirements.md
└── tasks.md           # generado por /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   └── schema.prisma                         # + valor ONCE en enum Frequency
└── src/
    └── modules/
        └── recurring/
            ├── recurring.service.ts          # ONCE en processRecurring
            ├── recurring.schema.ts           # Zod: añadir ONCE en createRecurring/updateRecurring
            ├── recurring.routes.ts           # + GET /projection
            ├── recurring.controller.ts       # + getProjection
            ├── projection.service.ts         # NUEVO (cálculo de quincenas)
            └── recurring.test.ts             # tests ONCE + proyección

frontend/
├── src/
│   ├── api/
│   │   └── recurring.api.ts                  # + getProjection
│   ├── components/
│   │   ├── budgets/
│   │   │   └── BiweeklyTimeline.tsx          # NUEVO
│   │   └── layout/
│   │       ├── Sidebar.tsx                   # label "Movimientos programados"
│   │       └── BottomTabBar.tsx              # idem
│   ├── pages/
│   │   ├── RecurringPage.tsx                 # título + filtros + form ONCE
│   │   └── BudgetsPage.tsx                   # integra <BiweeklyTimeline />
│   ├── types/
│   │   └── index.ts                          # Frequency union: + 'ONCE'
│   └── utils/
│       └── constants.ts                      # FREQUENCIES + ONCE
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Endpoint nuevo `GET /api/recurring/projection` en lugar de extender `/budgets/summary` | La proyección quincenal es una vista derivada de los movimientos programados, su lógica vive en el módulo recurring; añadirla a budgets ensucia ese módulo con conocimiento de cómo iterar `calculateNextExecutionDate`. | Añadir a budgets/summary: rechazado por acoplamiento cruzado entre módulos. |

## Phase 0 — Research

Ver [research.md](./research.md). Cubre: (R1) cómo iterar `calculateNextExecutionDate` para proyectar múltiples ocurrencias en el mes, (R2) reglas de quincena (1–15 vs 16–fin), (R3) qué hacer con movimientos `ONCE` ya ejecutados, (R4) UX del filtro y del form.

## Phase 1 — Design Artifacts

- [data-model.md](./data-model.md): cambio único en enum `Frequency` + entidades cliente derivadas.
- [contracts/projection-api.md](./contracts/projection-api.md): contrato del nuevo endpoint.
- [quickstart.md](./quickstart.md): guía de validación manual y automatizada.

## Re-evaluación Constitution Check post-diseño

Tras Phase 1, todos los gates siguen pasando. No se introducen dependencias nuevas, no se rompe DRY, los tests cubren el nuevo flujo. Listo para `/speckit.tasks`.
