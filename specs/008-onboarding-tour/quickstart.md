# Quickstart — Validar el Tour de Onboarding

Esta guía valida la feature manualmente y a alto nivel automatiza puntos clave. Asume que el feature ya fue implementado por `/speckit.implement`.

## Requisitos

- Docker Compose levantado (`docker-compose up --build`).
- Backend en `:4000`, frontend en `:3000`, Postgres en `:5432`.
- Migración `add_user_tour_state` aplicada (`docker exec -it <backend> npx prisma migrate deploy`).

## A. Validación manual

### A1. Tour automático en primer login (User Story 1)

1. Crear un usuario nuevo desde `/register`.
2. Ir a `/login` e iniciar sesión.
3. **Esperado**: al aterrizar en `/dashboard`, una tarjeta de bienvenida aparece automáticamente, con título, descripción, indicador "Paso 1 de 12" y botones "Saltar", "Siguiente".
4. Pulsar "Siguiente" hasta el paso "Cuentas".
5. **Esperado**: la app navega a `/accounts` automáticamente; la tarjeta queda anclada al elemento con `data-tour="accounts-list"`. Como el usuario no tiene cuentas, aparece CTA "Crear mi primera cuenta".
6. Pulsar el CTA → debe abrirse el modal de creación de cuenta. Cerrar el modal sin crear nada.
7. Continuar con "Siguiente" hasta el último paso (paso 12, Cierre).
8. Pulsar "Finalizar".
9. **Esperado**: el tour se cierra. En BD: `SELECT "tourStatus","tourVersion" FROM "User" WHERE email='<user>'` → `('COMPLETED', '1')`.

### A2. Cerrar sesión y volver a entrar

1. Logout y login con el mismo usuario.
2. **Esperado**: el tour NO se reabre.

### A3. Saltar el tour (User Story 2)

1. Crear otro usuario nuevo.
2. Login y, en el paso 3, pulsar `Esc` (o "Saltar").
3. **Esperado**: tour cerrado. BD: `tourStatus='SKIPPED'`, `tourVersion='1'`.
4. Logout/login: el tour no reaparece.

### A4. Reiniciar desde Settings (User Story 3)

1. Con un usuario que ya completó/saltó, ir a `/settings`.
2. Localizar el control "Reiniciar tour de bienvenida" y pulsarlo.
3. **Esperado**: la app redirige a `/dashboard` y el tour comienza desde el paso 1. BD durante este lapso: `tourStatus='NOT_STARTED'`, `tourVersion=null`.
4. Completar de nuevo → BD vuelve a `('COMPLETED', '1')`.

### A5. Accesibilidad (User Story 5)

1. Iniciar el tour.
2. Recorrer la primera tarjeta usando solo `Tab`/`Shift+Tab`. **Esperado**: el foco no escapa de la tarjeta.
3. Pulsar `Enter` con el foco en "Siguiente" → avanza.
4. Pulsar `Esc` → tour se cierra como `SKIPPED`.
5. Activar lector de pantalla (NVDA/VoiceOver) y abrir la primera tarjeta. **Esperado**: anuncia rol "diálogo", título y descripción.
6. Activar `prefers-reduced-motion` en el SO y reabrir el tour. **Esperado**: las animaciones de spotlight/transición se reducen drásticamente.

### A6. Tema oscuro/claro y responsive

1. Alternar entre dark y light mode mientras el tour está abierto. **Esperado**: la tarjeta y el spotlight cambian de tokens y mantienen contraste WCAG AA.
2. Reducir viewport a ~360px. **Esperado**: la tarjeta se adapta sin overflow horizontal; los botones permanecen utilizables.

## B. Validación automatizada (mínima)

### B1. Backend (Jest + Supertest)

`backend/src/modules/onboarding/onboarding.test.ts` cubre:

- GET inicial → `NOT_STARTED`, `version=null`.
- PATCH `COMPLETED` + `version="1"` → 200 y persiste.
- PATCH `NOT_STARTED` (reinicio) → version queda `null` aunque se envíe.
- PATCH `COMPLETED` sin version → 422.
- PATCH con status fuera del enum → 422.
- Sin Authorization header → 401.
- Dos usuarios concurrentes mantienen estados independientes.

Ejecución:

```bash
cd backend && npm run test -- onboarding.test
```

### B2. Frontend (Vitest + RTL)

Cubrir como mínimo:

- `tourSteps.ts`: 12 pasos definidos, `TOUR_VERSION === "1"`.
- `TourCard` renderiza título, descripción, botones y respeta `placement`.
- Pulsar `Esc` dispara cierre con motivo `skipped`.
- Cuando `hasAccounts === false` y el paso es `accounts-intro`, el CTA es visible.
- `useOnboardingTour` abre el tour si la respuesta del GET es `NOT_STARTED`.

Ejecución:

```bash
cd frontend && npm run test -- onboarding
```

## C. Verificación de constitución

```bash
# Backend
cd backend && npm audit --omit=dev
# Frontend
cd frontend && npm audit --omit=dev
```

Ambos comandos deben reportar `0 vulnerabilities`. Si no, `/speckit.implement` debe replantear (ver plan §Re-evaluación).

## D. Criterios de éxito (referencia rápida)

- SC-001 al SC-007 verificables con A1–A6 y telemetría a evaluar tras release.
- Una vez validados A1–A6 y B1–B2 sin regresiones, la feature está lista para merge a `main`.
