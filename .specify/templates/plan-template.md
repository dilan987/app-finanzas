# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: [e.g., TypeScript 5.x]  
**Primary Dependencies**: [e.g., Express.js, React 18, Prisma]  
**Storage**: [e.g., PostgreSQL 16]  
**Testing**: [e.g., Jest, Vitest]  
**Target Platform**: [e.g., Web (Docker)]
**Project Type**: [e.g., web-service + SPA]  
**Performance Goals**: [domain-specific]  
**Constraints**: [domain-specific]  
**Scale/Scope**: [domain-specific]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   ├── middlewares/
│   ├── modules/
│   ├── utils/
│   └── types/
└── prisma/

frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── routes/
│   ├── store/
│   ├── types/
│   └── utils/
└── public/
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
