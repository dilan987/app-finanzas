# Data Model: Full-Stack Dependency Migration

**Feature**: 002-dependency-migration  
**Date**: 2026-04-12

---

## Overview

This is a **zero data-model change** feature. No database schema modifications, no new tables, no column changes. The migration is purely at the application and tooling layer.

## Existing Models (Unchanged)

All 9 Prisma models remain identical:

- **User**: Authentication and profile data
- **PasswordResetToken**: Password reset flow
- **RefreshToken**: JWT refresh token storage
- **Category**: Transaction categorization (income/expense)
- **Transaction**: Financial transactions (the core entity)
- **Budget**: Monthly budget tracking per category
- **RecurringTransaction**: Automated recurring entries
- **Investment**: Investment portfolio tracking
- **Recommendation**: Analytics-generated insights

## Prisma Schema Changes (Config Only)

The `schema.prisma` file changes are **configuration-only**, not data model:

| Section | Prisma 5 (Current) | Prisma 7 (Target) |
|---|---|---|
| Generator provider | `prisma-client-js` | `prisma-client` |
| Binary targets | `["native", "linux-musl-openssl-3.0.x"]` | Removed (driver adapters replace this) |
| Datasource | In `schema.prisma` | Moves to `prisma.config.ts` |
| Driver | Implicit (built-in) | Explicit: `@prisma/adapter-pg` + `pg` |

## Data Safety Invariants

- **FR-021**: ZERO records lost/corrupted/altered
- PostgreSQL stays on v16 (same data directory)
- bcrypt 6 is backward-compatible with bcrypt 5 hashes (same algorithm, same salt format)
- JWT tokens will be invalidated by secret key format but recoverable via re-login (FR-022)
