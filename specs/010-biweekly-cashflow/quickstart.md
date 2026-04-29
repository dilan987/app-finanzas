# Quickstart — Cash Flow por Quincena Configurable

## A. Validación manual

### A1. Default calendario (US1)

1. Login con un usuario que tenga transacciones reales del mes actual en distintas fechas.
2. Ir a `/budgets` → modo "Quincenal".
3. **Esperado**: ver Q1 y Q2 con label "Primera quincena (1–15)" y "Segunda quincena (16–último día)". Las transacciones reales aparecen en el bucket correspondiente al `date` de cada una. Totales calculados solo con INCOME y EXPENSE; TRANSFER se lista pero no afecta totales.

### A2. Configurar cortes personalizados (US2)

1. Ir a `/settings`.
2. Localizar la sección "Quincenas".
3. Activar el toggle "Personalizar mis cortes de quincena".
4. Poner Q1 = 30, Q2 = 15. Guardar.
5. **Esperado**: vista previa muestra "Para mayo 2026: Primera quincena 30 abr – 14 may; Segunda quincena 15 may – 29 may". Persistencia en BD: `biweeklyCustomEnabled=true`, días 30 y 15.
6. Volver a `/budgets` → "Quincenal".
7. **Esperado**: los headers ahora dicen "30 abr – 14 may" y "15 may – 29 may". Las transacciones del 28 abril, 5 may, 14 may → en Q1. Las del 15, 20, 28 may → en Q2. Las del 30 may → no aparecen (van a Q1 de junio).

### A3. Febrero / días inválidos (US3)

1. Con custom Q1=30, Q2=15 ya configurado, navegar a febrero 2026 (28 días).
2. **Esperado**: los rangos se calculan con `clamp`. Q1 = "30 ene – 14 feb" (enero sí tiene 30+); Q2 = "15 feb – 28 feb" (clamp del 29 a 28). No hay errores ni desbordes.

### A4. Vista previa en Settings (US4)

1. En `/settings`, sección Quincenas, activar custom.
2. Mover los selectores entre 1 y 31.
3. **Esperado**: el texto debajo cambia en tiempo real. Ej. Q1=10, Q2=25 → "Primera quincena 10 may – 24 may; Segunda quincena 25 may – 9 jun"... wait, sí, q1<q2 → no cruza meses, q1=día10..día24, q2=día25..lastDay.

### A5. Toggle off vuelve a calendario (FR-004)

1. Con custom activo y datos guardados, desactivar el toggle.
2. Guardar.
3. Volver a `/budgets` Quincenal.
4. **Esperado**: vuelve a "Primera quincena (1–15)" / "Segunda quincena (16–...)" — los días personalizados pueden permanecer en BD pero no se aplican.

### A6. Validación del form

1. Activar custom. Poner Q1=15, Q2=15. Intentar guardar.
2. **Esperado**: mensaje "Los días deben ser diferentes". No se guarda.
3. Poner Q1=32 (si el selector lo permite o vía API). **Esperado**: 422 con "fuera de rango 1–31".

### A7. Mes futuro vacío (FR-014)

1. Sin custom, navegar a un mes futuro (ej. junio 2026 si hoy es abril).
2. **Esperado**: las dos quincenas vacías y mensaje "Las transacciones de este mes aún no se han registrado. Programa tus pagos en Movimientos programados o consulta la vista Mensual para la proyección."

## B. Validación automatizada

### B1. Backend (Jest)

```bash
cd backend && npm run test -- cashflow
cd backend && npm run test -- users
cd backend && npm run test -- biweekly
```

Cubre:
- `computeBiweeklyRanges` con casos: calendar, custom q1<q2, custom q1>q2, febrero con clamp, q1=q2 → degrada a calendar.
- `GET /api/cashflow/biweekly` con default y custom; 401 sin token; 422 con month inválido; transferencias excluidas de totales; aislamiento entre usuarios.
- `PUT /api/users/profile` con biweekly fields: custom enabled requiere días distintos; rangos válidos.

### B2. Frontend (Vitest)

```bash
cd frontend && npm run test -- biweekly
cd frontend && npm run test -- SettingsPage
```

Cubre:
- `computeBiweeklyRanges` espejo: mismos casos que backend.
- `BiweeklyTimeline` con response mock muestra los rangeLabel y suma totales correctamente.
- Sección Quincenas en SettingsPage: toggle + selectores actualizan preview en tiempo real.

## C. Constitución

```bash
cd backend && npm audit --omit=dev
cd frontend && npm audit --omit=dev
```

Ambos: `0 vulnerabilities`.

## D. Criterios de éxito

SC-001 a SC-007 quedan validados con A1–A7 + B1–B2. Sin regresiones en la vista Mensual ni en otros módulos.
