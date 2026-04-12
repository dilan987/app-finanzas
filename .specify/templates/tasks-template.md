# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 Setup database schema and migrations
- [ ] T004 [P] Configure middleware and routing

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Brief description]
**Independent Test**: [How to verify]

### Implementation

- [ ] T005 [US1] Create model in src/models/
- [ ] T006 [US1] Implement service in src/services/
- [ ] T007 [US1] Implement endpoint/feature

**Checkpoint**: User Story 1 independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] TXXX [P] Documentation updates
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase
- **Polish (Final Phase)**: Depends on all user stories
