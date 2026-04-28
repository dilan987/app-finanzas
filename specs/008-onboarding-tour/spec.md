# Feature Specification: Tour de Onboarding Interactivo

**Feature Branch**: `008-onboarding-tour`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Tour de onboarding interactivo para nuevos usuarios. Cuando un usuario se registra e ingresa por primera vez a la app, debe iniciarse automáticamente un tour guiado que le explique las secciones principales y cómo empezar a usar la aplicación."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tour automático al primer ingreso (Priority: P1)

Un usuario recién registrado entra por primera vez a la aplicación. Inmediatamente después del primer login (no del registro previo) se inicia un tour guiado en formato de tarjetas pequeñas (tooltips/popovers) anclados a elementos reales de la interfaz, presentando de forma secuencial las secciones principales de la app y orientándolo a dar el primer paso accionable: crear su primera cuenta.

**Why this priority**: Es el núcleo de la funcionalidad. Sin esta historia el feature no existe; reduce la fricción inicial y aumenta la activación de usuarios nuevos, que es el objetivo de negocio explícito.

**Independent Test**: Crear un usuario nuevo, iniciar sesión por primera vez y verificar que el tour aparece automáticamente sin acción del usuario, recorre los pasos en orden, y al finalizar queda marcado como completado para que no vuelva a aparecer en logins posteriores.

**Acceptance Scenarios**:

1. **Given** un usuario recién registrado que nunca ha completado ni saltado el tour, **When** inicia sesión por primera vez y aterriza en el dashboard, **Then** el sistema muestra automáticamente la primera tarjeta del tour resaltando la sección de bienvenida del dashboard.
2. **Given** un usuario en el paso N del tour, **When** pulsa "Siguiente", **Then** el sistema oculta la tarjeta actual, avanza al paso N+1 y resalta el elemento correspondiente, navegando entre páginas si el siguiente paso está en otra sección.
3. **Given** un usuario en cualquier paso del tour, **When** pulsa "Anterior", **Then** el sistema regresa al paso previo (o deshabilita el botón si es el primero).
4. **Given** un usuario en el último paso del tour, **When** pulsa "Finalizar", **Then** el sistema cierra el tour, persiste el estado de completado en el backend y no vuelve a mostrarlo automáticamente en futuros ingresos.
5. **Given** un usuario sin cuentas creadas en el paso de "Cuentas", **When** ve la tarjeta correspondiente, **Then** la tarjeta incluye un llamado a la acción explícito ("Crear mi primera cuenta") que al pulsarse abre el formulario de creación de cuenta y pausa el tour hasta que el usuario decida continuar o cerrar el formulario.
6. **Given** un usuario que ya completó o saltó el tour previamente, **When** vuelve a iniciar sesión, **Then** el tour NO se inicia automáticamente.

---

### User Story 2 - Saltar el tour en cualquier momento (Priority: P1)

Un usuario nuevo no quiere ver el tour completo y prefiere explorar la app por su cuenta. Debe poder cerrarlo en cualquier paso sin que vuelva a aparecer automáticamente, pero conservando la posibilidad de re-lanzarlo manualmente más adelante.

**Why this priority**: Forzar el tour es anti-patrón de UX. La opción de saltar es obligatoria para no frustrar a usuarios con experiencia previa en apps similares.

**Independent Test**: Iniciar el tour como usuario nuevo, pulsar "Saltar" en un paso intermedio y verificar que el tour se cierra, no reaparece en logins posteriores, y queda registrado como "saltado" (no como "completado").

**Acceptance Scenarios**:

1. **Given** un usuario en cualquier paso del tour, **When** pulsa el botón "Saltar" o cierra la tarjeta con la tecla Esc, **Then** el sistema cierra el tour inmediatamente y persiste el estado como "saltado".
2. **Given** un usuario que saltó el tour, **When** vuelve a iniciar sesión, **Then** el tour no se inicia automáticamente.
3. **Given** un usuario que saltó el tour, **When** consulta el estado en su perfil/configuración, **Then** ve que el tour figura como "no completado" con la opción de reiniciarlo.

---

### User Story 3 - Reiniciar el tour desde el perfil (Priority: P2)

Un usuario que ya completó o saltó el tour quiere volver a verlo (por ejemplo, tras una actualización con nuevas secciones, o porque olvidó cómo funciona alguna parte). Debe encontrar una opción explícita en su perfil/configuración para reiniciar el tour desde el primer paso.

**Why this priority**: Mejora la retención y reduce solicitudes de soporte, pero no es esencial para el primer release; los nuevos usuarios ya están cubiertos por las historias 1 y 2.

**Independent Test**: Como usuario con tour completado, ir al perfil/configuración, pulsar "Reiniciar tour" y verificar que el tour comienza de inmediato desde el primer paso, navegando al dashboard si el usuario estaba en otra página.

**Acceptance Scenarios**:

1. **Given** un usuario con tour completado o saltado, **When** entra a su perfil/configuración, **Then** ve un control claramente etiquetado "Reiniciar tour de bienvenida" con una breve descripción de qué hace.
2. **Given** un usuario en su perfil, **When** pulsa "Reiniciar tour", **Then** el sistema lo redirige al dashboard e inicia el tour desde el paso 1.
3. **Given** un usuario que reinició el tour y lo termina nuevamente, **When** finaliza, **Then** el estado vuelve a quedar como "completado".

---

### User Story 4 - Recorrido por todas las secciones clave (Priority: P1)

El tour debe cubrir, en orden lógico, las secciones principales: Dashboard, Cuentas, Categorías, Transacciones, Presupuestos, Recurrentes, Metas, Inversiones, Analytics y Reportes. Cada sección recibe al menos una tarjeta con título corto y descripción breve en español, anclada a un elemento real de la UI de esa sección.

**Why this priority**: Sin este recorrido el tour no cumple su objetivo educativo. Es parte indivisible del MVP del feature.

**Independent Test**: Recorrer el tour completo paso a paso desde el primer login y verificar que cada una de las 10 secciones listadas aparece al menos una vez con contenido en español, anclado a un elemento visible en la página correspondiente.

**Acceptance Scenarios**:

1. **Given** un usuario en el tour, **When** avanza secuencialmente con "Siguiente", **Then** la app navega automáticamente entre páginas cuando el siguiente paso pertenece a otra sección, sin que el usuario tenga que hacerlo manualmente.
2. **Given** un paso del tour anclado a un elemento de la UI, **When** se renderiza la tarjeta, **Then** el elemento referenciado queda visualmente resaltado (por ejemplo con halo/contorno) y la tarjeta apunta a él.
3. **Given** un paso anclado a un elemento que no existe en la página actual (por error o cambio de UI), **When** se renderiza la tarjeta, **Then** el sistema degrada el paso a un mensaje centrado en pantalla sin romper el flujo y registra un aviso para diagnóstico.

---

### User Story 5 - Accesibilidad y experiencia consistente (Priority: P2)

El tour debe ser usable con teclado, compatible con lectores de pantalla, y respetar dark/light mode y diseño responsive del resto de la app.

**Why this priority**: Crítico para inclusividad y consistencia de marca, pero la lógica funcional puede validarse antes que la accesibilidad completa; se prioriza P2 para no bloquear el release inicial.

**Independent Test**: Recorrer el tour completo usando solo teclado (Tab/Shift+Tab para mover foco, Enter para Siguiente/Finalizar, Esc para Saltar), en modo oscuro y modo claro, y en viewports móvil (≤640px), tablet y escritorio.

**Acceptance Scenarios**:

1. **Given** un usuario navegando con teclado, **When** se abre una tarjeta del tour, **Then** el foco se mueve automáticamente al botón primario de la tarjeta y queda atrapado dentro de la tarjeta hasta cerrarla (focus trap).
2. **Given** un usuario en cualquier paso, **When** pulsa Esc, **Then** el tour se salta (equivalente a "Saltar").
3. **Given** un usuario en cualquier paso, **When** pulsa Enter sobre el botón con foco "Siguiente", **Then** avanza al paso siguiente.
4. **Given** un usuario con lector de pantalla, **When** se abre una tarjeta, **Then** el lector anuncia el rol de diálogo, el título y la descripción del paso.
5. **Given** la app en modo oscuro o claro, **When** se renderiza una tarjeta del tour, **Then** la tarjeta usa los tokens de color del tema activo manteniendo contraste accesible (mínimo WCAG AA).
6. **Given** un viewport móvil estrecho, **When** se renderiza una tarjeta, **Then** la tarjeta se adapta al ancho disponible sin desbordar y los botones permanecen alcanzables.

---

### Edge Cases

- ¿Qué pasa si el usuario refresca la página o cierra el navegador a mitad del tour? El estado de progreso parcial NO se persiste; al volver a entrar, si no completó ni saltó, el tour reinicia desde el primer paso.
- ¿Qué pasa si el usuario navega manualmente a otra ruta durante el tour? El tour pausa, y al volver a una ruta cubierta por el paso actual, retoma o se reinicia desde el primer paso de esa sección (decisión: reiniciar el paso actual desde su sección).
- ¿Qué pasa si el backend no responde al guardar el estado de completado? La UI cierra el tour normalmente pero reintenta la persistencia en background; si falla persistentemente, en el próximo login el tour podría reaparecer (riesgo aceptado, mejor que perder el cierre).
- ¿Qué pasa si una sección de la app aún no está disponible para el usuario (feature flag/permiso)? El paso correspondiente se omite automáticamente sin romper la secuencia.
- ¿Qué pasa si el usuario ya tiene datos (cuentas, transacciones) porque migró desde un export o registró antes datos vía API? El tour igual se muestra una vez, pero el paso accionable de "crear primera cuenta" se reemplaza por un mensaje informativo sin CTA, ya que tiene cuentas.
- ¿Qué pasa si la viewport es extremadamente pequeña o el elemento ancla está oculto detrás de un menú colapsado? El sistema abre el menú/sidebar antes de resaltar el elemento, o degrada a tarjeta centrada si el elemento sigue sin ser visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST detectar al iniciar sesión si el usuario no ha completado ni saltado el tour, consultando un estado persistido en el backend asociado al usuario.
- **FR-002**: El sistema MUST iniciar automáticamente el tour en el primer login de un usuario que no lo haya completado ni saltado.
- **FR-003**: El sistema MUST presentar el tour como una secuencia ordenada de tarjetas pequeñas, cada una con: título corto, descripción breve, indicador de progreso (paso N de total) y botones de navegación.
- **FR-004**: Los usuarios MUST poder avanzar al siguiente paso, regresar al anterior, saltar el tour y finalizarlo desde cualquier tarjeta donde esa acción aplique.
- **FR-005**: El sistema MUST cubrir, como mínimo, las siguientes secciones en este orden: (1) Bienvenida/Dashboard, (2) Cuentas, (3) Categorías, (4) Transacciones, (5) Presupuestos, (6) Recurrentes, (7) Metas, (8) Inversiones, (9) Analytics, (10) Reportes, (11) Cierre con próximo paso accionable.
- **FR-006**: El sistema MUST anclar cada paso a un elemento concreto de la UI de la sección correspondiente y resaltarlo visualmente; si el elemento no está disponible, el paso MUST degradarse a tarjeta centrada sin interrumpir el flujo.
- **FR-007**: El sistema MUST navegar automáticamente entre rutas cuando el siguiente paso pertenezca a una sección distinta a la actual.
- **FR-008**: El sistema MUST persistir en backend, asociado al usuario autenticado, el estado del tour con al menos los valores: "no iniciado", "completado", "saltado", junto con la fecha del último cambio de estado.
- **FR-009**: El sistema MUST permitir al usuario reiniciar el tour manualmente desde su perfil/configuración, lo que vuelve a presentar la secuencia completa desde el primer paso.
- **FR-010**: El sistema MUST permitir cerrar el tour con el botón "Saltar" o con la tecla Esc, registrando el estado como "saltado".
- **FR-011**: El sistema MUST atrapar el foco del teclado dentro de la tarjeta activa mientras el tour está abierto y restaurarlo al elemento previo al cerrarse.
- **FR-012**: El sistema MUST anunciar las tarjetas del tour como diálogos accesibles, con título y descripción legibles por lectores de pantalla.
- **FR-013**: El sistema MUST renderizar el tour en español como idioma único en este release.
- **FR-014**: El sistema MUST adaptar el tour a modo oscuro y claro usando los tokens del tema activo, manteniendo contraste WCAG AA.
- **FR-015**: El sistema MUST adaptar las tarjetas del tour a viewports móvil, tablet y escritorio sin desbordes ni elementos inalcanzables.
- **FR-016**: El sistema MUST aplicar animaciones suaves de entrada/salida y transición entre pasos que no excedan 300 ms por transición y respeten la preferencia `prefers-reduced-motion` del usuario.
- **FR-017**: El sistema MUST detectar si el usuario tiene cero cuentas al llegar al paso de "Cuentas" y, en ese caso, ofrecer un CTA accionable que abra el formulario de creación de cuenta; si el usuario ya tiene cuentas, el CTA se sustituye por un mensaje informativo sin acción.
- **FR-018**: El sistema MUST garantizar que el tour aparece como máximo una vez de forma automática por usuario; reapariciones requieren acción explícita del usuario (reinicio manual).
- **FR-019**: El sistema MUST omitir automáticamente cualquier paso cuya sección no esté accesible para el usuario actual (por ejemplo si en el futuro se añaden permisos por sección).
- **FR-020**: El sistema MUST exponer un endpoint para consultar y actualizar el estado del tour del usuario autenticado, protegido por la misma autenticación que el resto de endpoints de la app.
- **FR-021**: El paso final del tour ("Cierre") MUST mostrar un CTA dinámico de próximo paso accionable: si el usuario aún no tiene cuentas, "Crear mi primera cuenta"; si ya tiene cuentas pero no transacciones, "Registrar mi primera transacción"; si ya tiene ambos, un mensaje neutral de cierre sin CTA.
- **FR-022**: Mientras el CTA del paso "Cuentas" abre el modal de creación de cuenta, la tarjeta del tour MUST ocultarse temporalmente (sin destruir su estado) y reaparecer al cerrarse el modal en el mismo paso, permitiendo al usuario decidir avanzar o saltar.
- **FR-023**: Si el usuario navega manualmente a una ruta distinta a la del paso actual mientras el tour está abierto, el sistema MUST pausar el tour (ocultar tarjeta y spotlight conservando `currentStepIndex`) y reanudarlo automáticamente al regresar a la ruta del paso actual.
- **FR-024**: Si el endpoint de persistencia de estado del tour falla al guardar, el sistema MUST reintentar al menos una vez con backoff antes de aceptar la inconsistencia. La UI cierra el tour aunque el reintento falle definitivamente.
- **FR-025**: Si el elemento ancla de un paso vive dentro del sidebar/menú lateral y este está colapsado en móvil, el sistema MUST expandir el sidebar antes de calcular la posición del spotlight.
- **FR-026**: Cuando un paso no puede anclarse (elemento no encontrado tras el polling), el sistema MUST registrar un `console.warn` con el `step.id` para diagnóstico, además de degradar la tarjeta a `placement='center'`.
- **FR-027**: La sección de "Configuración" (SettingsPage) MUST mostrar el estado actual del tour del usuario ("Completado" / "Saltado" / "No iniciado") junto al botón de reinicio.

### Key Entities

- **TourState (estado del tour por usuario)**: Representa si un usuario completó, saltó o nunca hizo el tour. Atributos clave: identificador del usuario al que pertenece, estado actual ("no iniciado" / "completado" / "saltado"), fecha del último cambio de estado, versión del tour completada (para futuros tours actualizados).
- **TourStep (paso del tour, definido en cliente)**: Representa una tarjeta individual del recorrido. Atributos clave: identificador del paso, sección a la que pertenece, ruta a la que navegar antes de mostrarlo, selector del elemento ancla en la UI, título, descripción, posición sugerida (top/bottom/left/right), CTA opcional. Esta entidad se define en el frontend; no requiere persistencia en base de datos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 70% de los usuarios nuevos que ven el tour por primera vez lo completan o avanzan más allá del paso 5 antes de saltarlo.
- **SC-002**: Un usuario nuevo puede completar el tour en menos de 2 minutos en condiciones normales de red.
- **SC-003**: El tour aparece automáticamente en el primer login del 100% de los usuarios sin estado previo, y nunca aparece automáticamente en usuarios con estado "completado" o "saltado".
- **SC-004**: La tasa de creación de la primera cuenta dentro de las 24 horas posteriores al primer login es al menos 30% mayor en usuarios que vieron el tour comparado con un baseline previo (medible una vez disponible).
- **SC-005**: El tour pasa una auditoría manual de accesibilidad cubriendo: navegación completa por teclado, anuncios de diálogo por lector de pantalla, contraste WCAG AA en ambos temas, y respeto de `prefers-reduced-motion`.
- **SC-006**: El tour funciona correctamente en los tres breakpoints principales (móvil ≤640px, tablet 641-1024px, escritorio >1024px) sin desbordes ni elementos inalcanzables.
- **SC-007**: La persistencia del estado del tour es consistente entre dispositivos: un usuario que completa el tour en un dispositivo no lo ve reaparecer automáticamente en otro.

## Assumptions

- El usuario objetivo es una persona adulta hispanohablante con experiencia básica usando aplicaciones web; no se requiere localización a otros idiomas en este release.
- La app ya cuenta con autenticación funcional y un usuario autenticado tiene siempre un identificador único persistente accesible desde el frontend y el backend.
- Las rutas y secciones listadas (Dashboard, Cuentas, Categorías, Transacciones, Presupuestos, Recurrentes, Metas, Inversiones, Analytics, Reportes) existen y son accesibles tras el login.
- El control de "Reiniciar tour" se añade en `SettingsPage` (no en `ProfilePage`), por convención del proyecto.
- El tour es una capa de UI sobre la app existente y no debe modificar el comportamiento funcional de las secciones que recorre.
- El estado de progreso intermedio (paso actual) NO se persiste entre sesiones; solo el estado final (completado/saltado).
- La app es de uso personal por usuario (single-tenant por usuario); no aplica lógica de equipos o tours por rol en este release.
