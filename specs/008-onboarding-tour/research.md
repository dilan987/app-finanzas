# Phase 0 — Research: Tour de Onboarding

## R1 · Librería de tour vs implementación propia

**Decisión**: Implementación propia con `@floating-ui/react` (positioning) + Motion 12 (animaciones, ya en stack) + `react-focus-lock` (focus trap).

**Rationale**:
- Las librerías "todo-en-uno" (React Joyride, Reactour) traen dependencias obsoletas, estilos no integrables con Tailwind 4 sin overrides agresivos, y compatibilidad parcial o pendiente con React 19.
- Stack ya incluye Motion 12 para animaciones; reutilizar evita una segunda librería de animación.
- Una implementación propia de ~250 líneas con primitivas pequeñas y conocidas (Floating UI + focus-lock) es más robusta para nuestro stack y permite control total de UX (textos en español, tema dinámico, integración con Zustand, navegación entre rutas via React Router 7).
- Mantenimiento: las dos primitivas son pequeñas, MIT, ampliamente usadas y se pueden reemplazar fácilmente si surge un CVE.

**Alternativas consideradas**:
- **React Joyride**: maduro pero con peerDeps históricamente conflictivas con React 19; estilos difíciles de tematizar; añade ~50 KB.
- **Reactour v3**: API moderna pero menor mantenimiento; CSS interno propio; React 19 sin verificación oficial.
- **Shepherd.js**: framework-agnostic, pero requiere wrapping manual en React y trae jQuery-like APIs.
- **driver.js**: ligera pero opinionada en estilos y sin React bindings oficiales.

## R2 · Verificación de CVEs en dependencias candidatas

**Decisión**: añadir como deps de frontend `@floating-ui/react` y `react-focus-lock`. Antes de instalarlas en `/speckit.implement`, ejecutar `npm audit` y `npm view <pkg> dist-tags` para confirmar versión activa y revisar advisories.

**Rationale**:
- Constitución exige cero vulnerabilidades. Ambas son ampliamente usadas y mantenidas, sin CVEs históricos relevantes a la fecha de la spec, pero la verificación es obligatoria al instalar.
- Si en el momento de la implementación cualquiera presenta una CVE activa, el plan se replantea: (a) actualizar a versión patcheada, (b) sustituir por implementación interna de la primitiva afectada (focus trap es ~80 líneas; positioning solo se requiere para anclar tooltips, factible con Floating UI core sin el wrapper React).

**Alternativas consideradas**:
- **headlessui** para focus trap: no expone `Trap` aislado de un componente Dialog completo; usaríamos su Dialog pero queremos control sobre la presentación.
- **@radix-ui/react-popover**: trae focus management y positioning, pero su API impone componentes wrapper que chocan con el modelo de "anchor por selector" que necesitamos para apuntar a elementos ya existentes (sin envolverlos).

## R3 · Focus trap y accesibilidad

**Decisión**: usar `react-focus-lock` con `<FocusLock returnFocus>` envolviendo la `TourCard`. Anuncio del rol de diálogo con `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (título) + `aria-describedby` (descripción). Tecla Esc → "saltar" mediante listener global mientras el tour está abierto.

**Rationale**:
- `react-focus-lock` resuelve el caso difícil del focus trap correctamente con SSR/SPA, restauración de foco previo, y sin parchear DOM global.
- `role="dialog"` + `aria-modal` es el contrato estándar de WAI-ARIA para overlays de este tipo.

**Alternativas consideradas**:
- Implementar focus trap manual: viable pero error-prone en presencia de portals, autofocus y elementos con `tabindex` mixto.

## R4 · Anclaje a elementos en otras rutas

**Decisión**: configuración declarativa de pasos en `frontend/src/utils/tourSteps.ts`, donde cada paso tiene `route` (path absoluto) y `anchor` (selector CSS basado en `data-tour="<key>"`). El motor del tour, antes de mostrar un paso:

1. Lee la ruta actual con `useLocation`.
2. Si difiere de `step.route`, hace `navigate(step.route)` y espera al próximo render.
3. Polling con `requestAnimationFrame` (máximo ~30 frames ≈ 500 ms) hasta que el elemento exista; si no aparece, degrada a tarjeta centrada (`anchor=null`).
4. Calcula posición con Floating UI (`autoUpdate` para reflows).

**Rationale**:
- Selectores `data-tour` desacoplan el tour de la implementación de cada página (no depende de class names CSS) y son auto-documentados.
- El polling con timeout cubre el caso de páginas con suspense/lazy load sin bloquear el flujo.

**Alternativas consideradas**:
- Refs centralizadas en un context: requeriría que cada página registre sus refs en mount/unmount; más invasivo y propenso a fugas si la página no está montada.

## R5 · Persistencia del estado del tour

**Decisión**: 3 columnas nuevas en `User`:
- `tourStatus` (enum `TourStatus`): `NOT_STARTED` | `COMPLETED` | `SKIPPED`. Default `NOT_STARTED`.
- `tourVersion` (`String?`): versión del catálogo de pasos completada (e.g. `"1"`). Permite re-mostrar el tour si se publica una v2 con secciones nuevas.
- `tourUpdatedAt` (`DateTime?`): timestamp del último cambio.

**Rationale**:
- Estado 1:1 con el usuario, simple, sin necesidad de tabla aparte.
- `tourVersion` da puerta a invalidaciones futuras sin romper el contrato actual.
- Migración Prisma trivial; columnas nullable + default cubren usuarios existentes.

**Alternativas consideradas**:
- Tabla `UserOnboarding`: rechazada por overhead innecesario sin historia.
- Solo `localStorage`: rechazada por requisito explícito de consistencia entre dispositivos.

## R6 · Navegación con teclado y reduced motion

**Decisión**:
- `Tab` / `Shift+Tab` se mantienen dentro de la tarjeta vía focus trap.
- `Enter` activa el botón con foco.
- `Esc` global → "Saltar" (PATCH status=SKIPPED) y cierra.
- `→` y `←` opcionales como atajos de Siguiente/Anterior cuando el foco no esté en un input.
- Animaciones Motion 12 con `useReducedMotion()`: si el usuario prefiere reducir, se usa `transition={{ duration: 0 }}` y se omite el spotlight halo animado (reemplazado por borde estático).

**Rationale**:
- Combinación estándar de teclado para diálogos, bien conocida por usuarios de teclado y lectores de pantalla.
- `prefers-reduced-motion` es un requisito explícito.

## R7 · Spotlight (resaltado del elemento ancla)

**Decisión**: overlay SVG en portal a `body` con un agujero rectangular calculado a partir del `getBoundingClientRect()` del elemento ancla, con padding configurable y borde animado. Posicionamiento de la tarjeta delegado a Floating UI con `flip()`, `shift()`, `offset(12)`.

**Rationale**:
- Un overlay con backdrop oscurecido y un agujero recortado es el patrón visual estándar y facilita mantener la atención.
- Renderizado en portal evita conflictos de stacking context con la app.

**Alternativas consideradas**:
- Outline directo en el elemento ancla: limitaría a un borde sin oscurecer el resto, perdería contraste visual del paso destacado.

## R8 · Versionado del catálogo de pasos

**Decisión**: constante `TOUR_VERSION = "1"` exportada desde `utils/tourSteps.ts`. El frontend envía esta versión al `PATCH` y el backend la guarda en `tourVersion`. El frontend solo considera "completado" si `user.tourVersion === TOUR_VERSION`.

**Rationale**: permite añadir secciones nuevas en el futuro y forzar un nuevo recorrido sin migración de datos ni script ad-hoc.

## R9 · Detección de "primera entrada"

**Decisión**: tras login exitoso, el cliente hace `GET /api/onboarding/tour`. Si `status === 'NOT_STARTED'` o (`status === 'COMPLETED' && version !== TOUR_VERSION`), se abre el tour automáticamente. No se persiste progreso intermedio.

**Rationale**: simple, sin estado adicional, y compatible con el versionado.

## R10 · CTA accionable "Crear mi primera cuenta"

**Decisión**: el paso "Cuentas" consulta el store de cuentas (`useAccountStore`) en su `render`; si la lista está vacía, muestra botón primario "Crear mi primera cuenta" que dispara la apertura del modal de creación de cuenta de la página de Cuentas (vía un evento o estado en `accountStore`). Si ya hay cuentas, muestra mensaje informativo neutral.

**Rationale**: aprovecha lo ya existente sin replicar lógica de creación.

## Resumen de decisiones clave

| ID | Decisión |
|----|----------|
| R1 | Implementación propia con Floating UI + Motion + react-focus-lock |
| R2 | Validar CVEs antes de instalar; replan si hay hallazgos |
| R3 | `react-focus-lock` + ARIA dialog estándar |
| R4 | Pasos declarativos con `data-tour` selectors y polling |
| R5 | 3 columnas en `User` + enum `TourStatus` |
| R6 | Atajos Esc/Enter/Tab/flechas + reduced-motion |
| R7 | Spotlight SVG con portal |
| R8 | `TOUR_VERSION` para invalidación futura |
| R9 | Auto-apertura si NOT_STARTED o version desactualizada |
| R10 | CTA condicional según existencia de cuentas |
