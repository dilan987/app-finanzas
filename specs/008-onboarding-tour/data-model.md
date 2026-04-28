# Data Model — 008-onboarding-tour

## 1. Cambios en la base de datos

### 1.1. Nuevo enum `TourStatus`

```prisma
enum TourStatus {
  NOT_STARTED
  COMPLETED
  SKIPPED
}
```

### 1.2. Modelo `User` — columnas añadidas

```prisma
model User {
  // ... columnas existentes
  tourStatus    TourStatus @default(NOT_STARTED)
  tourVersion   String?
  tourUpdatedAt DateTime?
  // ...
}
```

| Columna | Tipo | Default | Nullable | Descripción |
|---------|------|---------|----------|-------------|
| `tourStatus` | `TourStatus` | `NOT_STARTED` | NO | Estado actual del tour para el usuario. |
| `tourVersion` | `String` | `null` | SÍ | Versión del catálogo de pasos completada/saltada (`"1"`, `"2"`...). |
| `tourUpdatedAt` | `DateTime` | `null` | SÍ | Última vez que cambió el estado. |

### 1.3. Migración

Nombre: `add_user_tour_state`. La migración real la genera Prisma con `prisma migrate dev --name add_user_tour_state`. SQL ilustrativo equivalente:

```sql
CREATE TYPE "TourStatus" AS ENUM ('NOT_STARTED', 'COMPLETED', 'SKIPPED');
ALTER TABLE "User"
  ADD COLUMN "tourStatus" "TourStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "tourVersion" TEXT,
  ADD COLUMN "tourUpdatedAt" TIMESTAMP(3);
```

Usuarios existentes quedan con `tourStatus='NOT_STARTED'` → al próximo login verán el tour. Decisión deliberada: les damos la oportunidad de descubrir el feature.

## 2. Reglas de transición de estado

| Estado origen | Acción | Estado destino | Side effect |
|---------------|--------|----------------|-------------|
| `NOT_STARTED` | usuario completa último paso | `COMPLETED` | `tourVersion`=TOUR_VERSION, `tourUpdatedAt`=now() |
| `NOT_STARTED` | usuario salta | `SKIPPED` | `tourVersion`=TOUR_VERSION, `tourUpdatedAt`=now() |
| `COMPLETED` | usuario reinicia desde Settings | `NOT_STARTED` | `tourVersion`=null, `tourUpdatedAt`=now() |
| `SKIPPED` | usuario reinicia desde Settings | `NOT_STARTED` | `tourVersion`=null, `tourUpdatedAt`=now() |
| Cualquiera | `tourVersion` ≠ `TOUR_VERSION` actual | tratado como `NOT_STARTED` en cliente | (sin cambio en BD hasta que el usuario interactúe) |

Validación backend (Zod): el `PATCH` solo acepta los valores `NOT_STARTED`, `COMPLETED`, `SKIPPED`. Reglas adicionales de negocio se aplican en el service:

- `NOT_STARTED` desde Settings: limpia `tourVersion` a `null`.
- `COMPLETED` / `SKIPPED`: requiere `version` en el body, se persiste tal cual.

## 3. Entidad cliente: `TourStep`

Definida en `frontend/src/types/onboarding.ts`. NO se persiste. Configuración estática en `frontend/src/utils/tourSteps.ts`.

```ts
export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  id: string;                 // ej. "dashboard-overview"
  section: string;            // ej. "Dashboard"
  route: string;              // ej. "/dashboard"
  anchor: string | null;      // selector data-tour="..." o null para tarjeta centrada
  title: string;              // título corto en español
  description: string;        // descripción breve en español
  placement: TourStepPlacement;
  cta?: TourStepCta;          // acción opcional
}

export interface TourStepCta {
  label: string;
  action: 'create-account' | 'goto-route';
  payload?: { route?: string };
  showWhen?: (ctx: TourStepContext) => boolean; // ej. solo si no hay cuentas
}

export interface TourStepContext {
  hasAccounts: boolean;
  hasTransactions: boolean;
}
```

## 4. Entidad cliente: `OnboardingState` (Zustand)

```ts
export interface OnboardingState {
  status: TourStatus;            // 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED'
  version: string | null;
  isOpen: boolean;
  currentStepIndex: number;

  open: () => void;
  close: (reason: 'completed' | 'skipped') => Promise<void>;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  restart: () => Promise<void>;
  hydrateFromServer: () => Promise<void>;
}
```

Persistencia: ninguna (a diferencia de otros stores). El estado se rehidrata desde el backend tras el login.

## 5. Catálogo de pasos (versión 1)

| # | id | section | route | anchor (`data-tour`) | placement |
|---|----|---------|-------|----------------------|-----------|
| 1 | `welcome` | Bienvenida | `/dashboard` | `null` (centrado) | center |
| 2 | `dashboard-overview` | Dashboard | `/dashboard` | `dashboard-summary` | bottom |
| 3 | `accounts-intro` | Cuentas | `/accounts` | `accounts-list` | bottom |
| 4 | `categories-intro` | Categorías | `/categories` | `categories-list` | bottom |
| 5 | `transactions-intro` | Transacciones | `/transactions` | `transactions-create` | left |
| 6 | `budgets-intro` | Presupuestos | `/budgets` | `budgets-list` | bottom |
| 7 | `recurring-intro` | Recurrentes | `/recurring` | `recurring-list` | bottom |
| 8 | `goals-intro` | Metas | `/goals` | `goals-list` | bottom |
| 9 | `investments-intro` | Inversiones | `/investments` | `investments-list` | bottom |
| 10 | `analytics-intro` | Analytics | `/analytics` | `analytics-charts` | top |
| 11 | `reports-intro` | Reportes | `/reports` | `reports-export` | left |
| 12 | `closing` | Cierre | `/dashboard` | `null` (centrado) | center |

El paso `closing` declara un CTA dinámico (FR-021) resuelto en runtime: si `!hasAccounts` → "Crear mi primera cuenta"; si `hasAccounts && !hasTransactions` → "Registrar mi primera transacción"; si ambos → mensaje neutral sin CTA.

`TOUR_VERSION = "1"`.

## 6. Reglas de integridad

- Un usuario solo puede leer/modificar su propio estado de tour (enforced por `req.user.id` en el service, sin parámetro de userId expuesto).
- El backend NO almacena el catálogo de pasos; el cliente es la fuente de verdad de la estructura del tour.
- El backend NO persiste el paso actual (no hay reanudación parcial — decisión documentada en spec).
