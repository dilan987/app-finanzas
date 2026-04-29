# Feature Specification: Movimientos Programados y Proyección por Quincena

**Feature Branch**: `009-scheduled-movements`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "Extender el sistema de Transacciones Recurrentes para soportar movimientos puntuales (una sola ejecución) además de los repetitivos, y agregar visualización de la proyección de cash flow por quincena/fecha."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Programar un movimiento puntual con fecha (Priority: P1)

Un usuario sabe que tendrá un gasto único en una fecha específica del mes (cumpleaños, mantenimiento del auto, viaje, regalo). Quiere registrar ese gasto antes de que ocurra para ver su efecto en la proyección del mes y de la quincena correspondiente, sin tener que crearlo como recurrente repetitivo.

**Why this priority**: Es la pieza nueva que habilita todo lo demás. Sin movimientos puntuales con fecha, la proyección por quincena no es real y el agente IA futuro no tiene datos granulares.

**Independent Test**: Ir a la sección "Movimientos programados", crear un movimiento con frecuencia "Solo una vez" y fecha 23 de mayo, verificar que aparece en el listado, que figura en la quincena correcta del timeline, y que tras simular su ejecución queda desactivado y NO se regenera.

**Acceptance Scenarios**:

1. **Given** el usuario en la sección "Movimientos programados", **When** abre el formulario de creación y elige frecuencia "Solo una vez" con fecha 2026-05-23 y monto $300.000, **Then** el sistema crea el movimiento con esa fecha exacta como fecha de ejecución y lo marca como activo.
2. **Given** un movimiento puntual con fecha 2026-05-23 y estado activo, **When** llega esa fecha y el sistema ejecuta el movimiento (genera la transacción correspondiente), **Then** el sistema marca el movimiento como inactivo y NO programa una nueva fecha de ejecución.
3. **Given** un movimiento repetitivo existente (frecuencia mensual), **When** se ejecuta en su fecha, **Then** el sistema sigue programando la siguiente ejecución como hasta ahora (sin cambios respecto al comportamiento actual).
4. **Given** un usuario crea un movimiento puntual con fecha en el pasado por error, **When** intenta guardar, **Then** el sistema lo permite pero advierte que la fecha es pasada y el movimiento no se ejecutará automáticamente; el usuario puede ajustar la fecha o registrarlo directamente como transacción real.

---

### User Story 2 - Visualizar la proyección por quincena (Priority: P1)

Un usuario quiere ver no solo el total proyectado del mes sino cómo se distribuye ese flujo entre la primera y la segunda quincena, para anticipar quincenas con poco saldo. La sección de Presupuestos/Proyección debe mostrar una vista de timeline con esa agrupación.

**Why this priority**: Es la otra mitad del feature. Sin la vista, los datos están pero el usuario no los ve y el valor entregado es nulo.

**Independent Test**: Crear varios movimientos programados (recurrentes y puntuales) con fechas distribuidas en el mes, ir a la sección de Presupuestos, verificar que aparece una vista timeline con dos columnas/secciones (Q1 y Q2), cada una listando los movimientos en orden cronológico y mostrando ingreso, gasto y balance neto de esa quincena.

**Acceptance Scenarios**:

1. **Given** un mes con 3 ingresos programados (uno el día 1, uno el día 15, uno el día 30) y 5 gastos programados distribuidos en el mes, **When** el usuario abre la sección de Presupuestos del mes actual, **Then** ve dos secciones "Primera quincena (1–15)" y "Segunda quincena (16–fin de mes)", cada una con la lista de movimientos de esa quincena ordenados por fecha.
2. **Given** la vista de quincenas, **When** se renderiza, **Then** cada quincena muestra: total ingresos proyectados, total gastos proyectados y balance neto proyectado de la quincena.
3. **Given** un movimiento programado con fecha de ejecución el día 16, **When** se renderiza la vista, **Then** aparece en la "Segunda quincena", no en la primera.
4. **Given** un movimiento programado con fecha de ejecución el día 15, **When** se renderiza la vista, **Then** aparece en la "Primera quincena".
5. **Given** un mes sin movimientos programados, **When** se renderiza la vista timeline, **Then** ambas quincenas se muestran con monto 0 y un mensaje vacío amigable, sin romper la página.
6. **Given** el usuario cambia el mes con el selector existente, **When** se actualiza la página, **Then** la vista timeline refleja los movimientos programados del nuevo mes.

---

### User Story 3 - Filtrar y administrar movimientos por tipo (Priority: P2)

La sección que hoy se llama "Recurrentes" pasa a llamarse "Movimientos programados" y debe permitir filtrar entre repetitivos y puntuales para que el usuario gestione cada tipo cómodamente.

**Why this priority**: Mejora la experiencia y permite encontrar rápido un movimiento, pero la funcionalidad mínima (US1+US2) puede entregarse sin filtros antes que con ellos.

**Independent Test**: En la sección "Movimientos programados", verificar que existen filtros "Todos / Repetitivos / Puntuales" y que cada uno muestra solo el subconjunto correspondiente.

**Acceptance Scenarios**:

1. **Given** un usuario con 5 movimientos repetitivos y 3 puntuales activos, **When** entra a la sección "Movimientos programados", **Then** la pestaña/filtro por defecto "Todos" muestra los 8.
2. **Given** la misma sección, **When** el usuario selecciona "Puntuales", **Then** solo ve los 3 movimientos con frecuencia "Solo una vez".
3. **Given** la misma sección, **When** el usuario selecciona "Repetitivos", **Then** solo ve los 5 con frecuencia distinta de "Solo una vez".
4. **Given** un movimiento puntual ya ejecutado (inactivo), **When** el usuario abre la sección, **Then** lo ve listado con marcador visual de "Ejecutado" y se puede archivar/eliminar; no aparece en la proyección futura.

---

### User Story 4 - Crear movimiento desde el formulario unificado (Priority: P1)

El formulario de creación/edición de movimientos programados debe ofrecer "Solo una vez" como opción de frecuencia junto a las existentes, con un selector de fecha claro y validación apropiada.

**Why this priority**: Sin esta historia US1 no se puede ejecutar desde la UI.

**Independent Test**: Abrir el formulario "Nuevo movimiento programado", verificar que el selector de frecuencia incluye "Solo una vez" y que al seleccionarlo aparece un selector de fecha (no un selector de día del mes ni de día de la semana).

**Acceptance Scenarios**:

1. **Given** el formulario abierto, **When** el usuario abre el selector de frecuencia, **Then** ve las opciones: Diaria, Semanal, Quincenal, Mensual, Anual, Solo una vez.
2. **Given** la frecuencia "Solo una vez" seleccionada, **When** el formulario se renderiza, **Then** muestra un campo de fecha único (no rangos ni patrones de repetición) con valor por defecto sugerido (hoy o el primer día del mes siguiente).
3. **Given** las demás frecuencias (Diaria, Semanal, Mensual...), **When** se renderiza el formulario, **Then** mantienen exactamente el comportamiento actual.
4. **Given** un movimiento puntual creado, **When** el usuario lo edita, **Then** puede cambiar la fecha o convertirlo a otra frecuencia (lo que activa la lógica de repetición).

---

### Edge Cases

- ¿Qué pasa si el usuario crea un movimiento puntual con fecha hoy mismo? El sistema lo permite. Si el cron/job de ejecución corre después, lo procesará en su próxima corrida. Si no se ejecuta antes de fin de día, queda pendiente y se ejecuta en la siguiente corrida.
- ¿Qué pasa si el cron está desactivado o no corre? Comportamiento idéntico al actual de los recurrentes: el movimiento se ejecutará la próxima vez que el cron se active si la fecha ya pasó.
- ¿Qué pasa con el primer día del mes para febrero (28/29) en la quincena? "Segunda quincena" siempre va del día 16 al último día calendario del mes (28, 29, 30 o 31).
- ¿Qué pasa si un movimiento repetitivo cae en la primera quincena un mes y en la segunda otro mes? Cada mes se calcula la quincena en función de la fecha proyectada de ese mes, no se hereda de meses previos.
- ¿Qué pasa si se desactiva un movimiento manualmente (recurrente o puntual) antes de su próxima fecha? No aparece en la proyección futura, ni en el timeline de quincena.
- ¿Qué pasa si un movimiento puntual está inactivo (ya ejecutado)? Se muestra en el historial de la sección con marcador "Ejecutado" pero NO se incluye en la proyección de quincena para meses futuros. Para el mes en que se ejecutó, se cuenta como movimiento que ya ocurrió y aparece como tal.
- ¿Qué pasa si dos movimientos tienen la misma fecha? Se listan ambos en orden estable (por hora de creación o por id) sin duplicación visual.
- ¿Qué pasa si un usuario tiene movimientos programados sin asociación a cuenta? La proyección los suma igual al cash flow del usuario, simplemente sin atribución a una cuenta específica.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST aceptar un nuevo valor de frecuencia "Solo una vez" para los movimientos programados, además de los existentes Diaria, Semanal, Quincenal, Mensual y Anual.
- **FR-002**: Cuando un movimiento con frecuencia "Solo una vez" se ejecuta, el sistema MUST marcarlo como inactivo automáticamente y NO debe programar una nueva fecha de ejecución.
- **FR-003**: Cuando un movimiento con cualquier otra frecuencia se ejecuta, el sistema MUST conservar el comportamiento actual (calcular y persistir la siguiente fecha de ejecución según la frecuencia).
- **FR-004**: El formulario de creación/edición de movimientos programados MUST ofrecer "Solo una vez" como opción de frecuencia, con un selector de fecha único.
- **FR-005**: La sección de UI actualmente etiquetada "Recurrentes" MUST renombrarse a "Movimientos programados" en todos los puntos de entrada visibles para el usuario (sidebar, header, breadcrumbs, títulos de página).
- **FR-006**: La sección "Movimientos programados" MUST permitir filtrar la lista por: Todos, Repetitivos, Puntuales. En v1 los filtros muestran tanto activos como inactivos (los puntuales ya ejecutados quedan visibles con badge "Ejecutado"); un sub-toggle para ocultar inactivos queda fuera de alcance v1.
- **FR-007**: La sección de Presupuestos/Proyección del mes seleccionado MUST mostrar una vista timeline con dos agrupaciones: "Primera quincena" (días 1–15) y "Segunda quincena" (día 16 al último día calendario del mes).
- **FR-008**: Cada agrupación quincenal del timeline MUST mostrar: lista de movimientos programados con fecha, descripción, monto y categoría; total ingresos proyectados de la quincena; total gastos proyectados de la quincena; balance neto proyectado de la quincena.
- **FR-009**: Los movimientos programados que cuentan en la proyección de un mes MUST ser aquellos con próxima fecha de ejecución dentro del mes seleccionado, independientemente de su frecuencia (incluyendo "Solo una vez").
- **FR-010**: Un movimiento "Solo una vez" inactivo (ya ejecutado) MUST NO aparecer en la proyección de quincenas para meses futuros, pero SÍ debe permanecer accesible en el historial de la sección "Movimientos programados".
- **FR-011**: La validación del formulario MUST advertir (sin bloquear) cuando se elige una fecha pasada para un movimiento "Solo una vez".
- **FR-012**: El sistema MUST mantener compatibilidad con todos los movimientos recurrentes existentes (creados antes de este feature): siguen funcionando exactamente igual, sin migración destructiva.
- **FR-013**: La asignación de un movimiento a una quincena MUST basarse en el día calendario de su próxima fecha de ejecución: día 1–15 → primera quincena; día 16–último → segunda quincena.
- **FR-014**: Cuando no hay movimientos programados en una quincena, la vista MUST mostrar un estado vacío amigable y totales en cero, sin error.
- **FR-015**: La vista timeline MUST sincronizarse con el selector de mes existente: cambiar el mes en la página de Presupuestos actualiza la vista quincenal.
- **FR-016**: La vista timeline MUST adaptarse a dark/light mode y a viewports móvil/tablet/escritorio sin desbordes.

### Key Entities *(include if feature involves data)*

- **Movimiento programado**: representa un ingreso o gasto proyectado en una fecha futura. Existe ya en la app con frecuencias repetitivas; con este feature se añade el valor "Solo una vez" para movimientos puntuales. Atributos relevantes (sin cambiar la forma del modelo): tipo (ingreso/gasto), monto, descripción, categoría, cuenta opcional, frecuencia, próxima fecha de ejecución, estado activo/inactivo.
- **Proyección quincenal** (vista derivada, no persistida): conjunto de movimientos programados de un mes agrupados por quincena, con totales y balance neto por quincena. Se calcula a demanda en función de los movimientos programados activos del usuario para ese mes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear, ver, editar y eliminar un movimiento "Solo una vez" sin asistencia adicional, en menos de 60 segundos desde la sección "Movimientos programados".
- **SC-002**: Tras la ejecución de un movimiento "Solo una vez", el 100% de las veces queda inactivo y NO se vuelve a generar (validable con tests de backend y manual).
- **SC-003**: La vista timeline por quincena se renderiza correctamente para cualquier mes con un mínimo de 0 y un máximo razonable (≥30) movimientos programados, sin desbordes ni errores de cálculo.
- **SC-004**: El balance neto mostrado en cada quincena coincide con la suma manual de los ingresos menos gastos de los movimientos listados en esa quincena (validable con un test).
- **SC-005**: Ningún movimiento recurrente existente cambia su comportamiento tras desplegar el feature (validable corriendo el conjunto de tests existente del módulo de recurrentes sin regresiones).
- **SC-006**: La nueva sección y la vista timeline pasan auditoría visual de dark/light mode en los tres breakpoints principales (móvil ≤640px, tablet 641–1024px, escritorio >1024px).
- **SC-007**: Los datos de la proyección quincenal están disponibles para consulta programática (a través del API existente o uno nuevo) en una forma que un futuro agente de IA pueda interrogar por rangos de fecha y por quincena, sin necesidad de transformación adicional en el cliente.

## Assumptions

- El motor que ejecuta los movimientos recurrentes hoy (cron/job o equivalente) puede ser extendido para reconocer la frecuencia "Solo una vez" sin reescritura completa.
- El sidebar y la navegación principal aceptan un cambio de etiqueta sin reorganizar el menú.
- La sección de Presupuestos ya tiene un selector de mes operativo y se puede integrar la vista timeline como una nueva sección dentro de la página o pestaña del mes.
- El usuario objetivo entiende los términos "primera quincena" (1–15) y "segunda quincena" (16–fin de mes) sin glosario adicional.
- Los movimientos programados ya tienen una "próxima fecha de ejecución" como propiedad del dato; el feature se apoya en esa fecha para clasificar a la quincena.
- No se introduce una entidad nueva en base de datos: el feature es retrocompatible añadiendo solo un valor al enum de frecuencia.
- La proyección quincenal NO incluye transacciones reales ya ejecutadas en el mes (solo lo proyectado por movimientos programados activos); las transacciones reales ya tienen su propia visualización en el resumen del mes.
