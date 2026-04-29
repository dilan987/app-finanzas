# Specification Quality Checklist — 009-scheduled-movements

## Content & Focus

- [x] Spec describes WHAT and WHY only.
- [x] Comprensible para stakeholders no técnicos.
- [x] Objetivo principal explícito y medible.
- [x] Alcance v1 acotado; out-of-scope listado.

## User Scenarios

- [x] Al menos un P1 testeable independientemente.
- [x] Cada US tiene Given/When/Then.
- [x] Edge cases listados (fecha pasada, fin de mes 28/29/30/31, movimiento ya ejecutado, sin cuenta asociada, dos en mismo día).
- [x] Prioridades P1/P2 justificadas.

## Requirements

- [x] FR testeables y sin ambigüedad.
- [x] MUST / MUST NOT consistentes.
- [x] No filtran detalles de implementación (no menciona Prisma enum específico, sí menciona "valor de frecuencia").
- [x] Cubre retrocompatibilidad (FR-012).
- [x] Cubre estado vacío (FR-014).
- [x] Cubre responsive y dark/light (FR-016).

## Data

- [x] Entidades clave conceptuales (sin forma de tabla).
- [x] Aclara qué se persiste vs qué se calcula.

## Success Criteria

- [x] Medibles y agnósticas de tecnología.
- [x] Incluye criterio de no-regresión (SC-005).
- [x] Incluye criterio de "consultable por agente IA futuro" (SC-007).

## Open Questions

- [x] 0 marcadores `[NEEDS CLARIFICATION]`.

## Readiness

- [x] Suficiente para `/speckit.plan` sin más input.
