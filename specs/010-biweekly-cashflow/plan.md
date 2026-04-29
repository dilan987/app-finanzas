# Implementation Plan: Cash Flow por Quincena con Cortes Configurables

**Branch**: `010-biweekly-cashflow` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/010-biweekly-cashflow/spec.md`

## Summary

Reemplazar la fuente de la vista Quincenal de `/budgets`: en lugar de proyectar `RecurringTransaction`, leer las `Transaction` reales del mes y agruparlas en dos buckets según los cortes configurados por el usuario (default 1/16 calendario, opcionalmente personalizados como 30/15). Persistir la preferencia por usuario, exponer un nuevo endpoint backend, agregar sección "Quincenas" en `/settings`, y descontinuar el endpoint anterior de proyección.

**Enfoque técnico**:

- **Backend**:
  - Tres columnas nuevas en `User`: `biweeklyCustomEnabled` (Bool, default false), `biweeklyStartDay1` (Int?, 1–31), `biweeklyStartDay2` (Int?, 1–31).
  - Nuevo helper `computeBiweeklyRanges(month, year, mode, day1, day2)` que devuelve `{ q1: { start, end }, q2: { start, end } }`. Vive en `backend/src/utils/biweekly.ts` y se reutiliza desde el endpoint y desde tests.
  - Nuevo endpoint `GET /api/cashflow/biweekly?month=&year=` en un módulo nuevo `cashflow/`. Devuelve los rangos y las transacciones reales agrupadas + totales por bucket.
  - Extensión del endpoint `GET /api/users/profile` y `PUT /api/users/profile` para devolver/actualizar la config quincenal (3 campos nuevos, opcionales). Validación Zod: si `biweeklyCustomEnabled=true`, los dos días son requeridos, distintos, y en rango 1–31.
  - Borrar (o dejar deprecado) `GET /api/recurring/projection` y su servicio: ya no se consume desde el front.

- **Frontend**:
  - Nueva API `cashflow.api.ts` con `getBiweekly({ month, year })`.
  - `BiweeklyTimeline` consume el nuevo endpoint; se elimina dependencia con `recurringApi.getProjection`.
  - Tipos `BiweeklyCashflowResponse`, `BiweeklyCashflowBucket`, `BiweeklyCashflowEntry`.
  - `User` interface se extiende con `biweeklyCustomEnabled`, `biweeklyStartDay1`, `biweeklyStartDay2`.
  - `SettingsPage`: nueva sección "Quincenas" con toggle + dos selectores numéricos + preview en tiempo real del rango calculado para el mes actual.
  - El componente `BiweeklyTimeline` muestra los rangos exactos en los headers ("30 abr – 14 may") en lugar de "1–15".

## Technical Context

**Language/Version**: TypeScript 6 (frontend y backend).

**Primary Dependencies**: Express.js 5, Prisma 6, Zod 4 (backend); React 19, Tailwind 4, Motion 12 (frontend). Sin nuevas dependencias.

**Storage**: PostgreSQL 16 vía Prisma. Cambios: 3 columnas nuevas en `User`.

**Testing**: Jest 30 + Supertest (backend), Vitest 4 + RTL (frontend).

**Target Platform**: Web SPA + API Node.js (Docker Compose).

**Performance Goals**:
- Endpoint `GET /api/cashflow/biweekly` <200 ms para usuarios con hasta 500 Transactions en el mes.
- Preview en `/settings` actualiza en <50 ms en cliente.

**Constraints**:
- Cero migración destructiva.
- Default behavior idéntico al actual (Q1=1, Q2=16) cuando `biweeklyCustomEnabled=false`.
- 100% TypeScript estricto.
- Sin nuevas dependencias.

**Scale/Scope**:
- 3 columnas nuevas en `User`, 1 endpoint nuevo, 1 helper compartido, 1 sección en Settings, 1 cambio menor en `BiweeklyTimeline`.

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| **I. Modular Architecture** | ✅ Nuevo módulo `cashflow/` con controller/service/schema/routes/tests. Los cambios en User son extensión del módulo `users` existente. |
| **II. Type Safety** | ✅ Prisma genera tipos tras añadir columnas; Zod valida la config; tipos TS frontend extendidos. |
| **III. Validation at Boundaries** | ✅ Zod en query del endpoint y en update de profile. Frontend valida antes de submit. |
| **IV. Security First** | ✅ Endpoints detrás de `authMiddleware`; queries scope a `req.user.id`. |
| **V. Zero-Vulnerability Dependencies** | ✅ Sin nuevas deps. `npm audit` reverificado. |
| **VI. Test Coverage** | ✅ Backend: tests del helper de rangos (calendar default, custom q1<q2, custom q1>q2, fin de mes corto, validación), tests del endpoint y tests de profile update. Frontend: tests del settings preview y del BiweeklyTimeline con datos reales. |
| **VII. DRY & Standardized** | ✅ El helper `computeBiweeklyRanges` se reutiliza desde tests, endpoint, y se exporta para que el frontend pueda calcular preview sin duplicar lógica (versión espejo idéntica en cliente, validable con tests). |

**Resultado**: PASA.

## Project Structure

### Documentation (this feature)

```text
specs/010-biweekly-cashflow/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── cashflow-api.md
│   └── profile-extension.md
├── checklists/
│   └── requirements.md
└── tasks.md           # /speckit.tasks
```

### Source Code

```text
backend/
├── prisma/
│   └── schema.prisma                      # + 3 columnas en User
└── src/
    ├── modules/
    │   ├── cashflow/                      # NUEVO
    │   │   ├── cashflow.controller.ts
    │   │   ├── cashflow.service.ts
    │   │   ├── cashflow.schema.ts
    │   │   ├── cashflow.routes.ts
    │   │   └── cashflow.test.ts
    │   ├── users/
    │   │   ├── users.service.ts           # extiende getProfile/updateProfile
    │   │   ├── users.schema.ts            # añade biweekly fields al updateProfileSchema
    │   │   └── users.test.ts              # tests del update biweekly
    │   └── recurring/
    │       └── projection.service.ts      # ELIMINAR (o marcar deprecated)
    │       └── recurring.routes.ts        # ELIMINAR ruta /projection
    │       └── recurring.controller.ts    # ELIMINAR getProjection
    ├── utils/
    │   └── biweekly.ts                    # NUEVO helper compartido
    └── app.ts                              # mount /api/cashflow

frontend/
├── src/
│   ├── api/
│   │   ├── cashflow.api.ts                 # NUEVO
│   │   └── recurring.api.ts                # quitar getProjection
│   ├── components/
│   │   └── budgets/
│   │       └── BiweeklyTimeline.tsx        # apunta a cashflowApi
│   ├── pages/
│   │   └── SettingsPage.tsx                # + sección "Quincenas"
│   ├── store/
│   │   └── authStore.ts                    # extender User
│   ├── types/
│   │   └── index.ts                        # User + BiweeklyCashflow* tipos
│   └── utils/
│       └── biweekly.ts                     # NUEVO espejo del backend (preview)
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Helper duplicado backend+frontend (`biweekly.ts`) | El preview en Settings necesita calcular rangos en cliente sin ida-vuelta al backend. Duplicar es ~30 líneas; un endpoint dedicado para preview sería overkill. | Llamar al backend para cada cambio de selector: rechazado por latencia y consumo de red en una interacción de tipeo. |
| Eliminar `GET /api/recurring/projection` en lugar de migrarlo | El nuevo endpoint en `cashflow/` cubre el caso de uso real (transacciones reales). Mantener el viejo es código muerto. | Mantener ambos: rechazado por DRY (constitución VII). |

## Phase 0 — Research

Ver [research.md](./research.md). Cubre: (R1) algoritmo de cálculo de rangos para cada caso (calendar default, custom q1<q2, custom q1>q2), (R2) manejo de días inexistentes en el mes (febrero, mes de 30 días con corte 31), (R3) ubicación del helper compartido y estrategia de espejo cliente, (R4) decisión sobre extensión del profile vs endpoint dedicado, (R5) eliminación del endpoint legacy `/recurring/projection`.

## Phase 1 — Design Artifacts

- [data-model.md](./data-model.md): cambios en `User` + entidades cliente.
- [contracts/cashflow-api.md](./contracts/cashflow-api.md): contrato del nuevo endpoint.
- [contracts/profile-extension.md](./contracts/profile-extension.md): extensión del endpoint de profile.
- [quickstart.md](./quickstart.md): validación manual y automática.

## Re-evaluación post-Phase 1

Todos los gates siguen pasando. Sin nuevas dependencias, sin violación DRY, tests cubren los casos de borde. Listo para `/speckit.tasks`.
