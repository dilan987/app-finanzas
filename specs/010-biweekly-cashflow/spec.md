# Feature Specification: Cash Flow por Quincena con Cortes Configurables

**Feature Branch**: `010-biweekly-cashflow`
**Created**: 2026-04-27
**Status**: Draft
**Input**: User description: "La vista quincenal hoy muestra solo programados; cambiar fuente a Transactions reales y permitir cortes de quincena configurables por usuario."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mis transacciones reales agrupadas por quincena calendario (Priority: P1)

Un usuario nuevo, que no ha tocado ninguna configuración, entra a la página de Presupuestos y cambia a modo "Quincenal". Quiere ver SUS transacciones reales del mes actual agrupadas en dos quincenas calendario (1–15 y 16–fin), con totales y balance neto por quincena.

**Why this priority**: Es la corrección del bug actual (la vista hoy ignora las transacciones reales) y el comportamiento por defecto que cualquier usuario espera sin tocar settings. Sin esta historia, el feature no aporta valor.

**Independent Test**: Sin tocar settings, registrar varias transacciones reales del mes actual en distintas fechas (días 5, 10, 16, 20, 28). Cambiar a vista Quincenal en /budgets. Verificar que las del 5 y 10 aparecen en Q1 (1–15) y las del 16, 20, 28 en Q2, con totales correctos y sin movimientos programados duplicados.

**Acceptance Scenarios**:

1. **Given** un usuario sin cortes personalizados configurados y con transacciones reales registradas del 1 al fin de mes, **When** entra al modo Quincenal de /budgets para el mes actual, **Then** ve dos tarjetas Q1 (1–15) y Q2 (16–último día del mes) con las transacciones reales de cada rango ordenadas por fecha.
2. **Given** la vista Quincenal renderizada, **When** se calculan los totales, **Then** cada quincena muestra suma de ingresos, suma de gastos y balance neto basados solo en transacciones reales (Transaction), sin incluir movimientos programados.
3. **Given** una quincena sin transacciones, **When** se renderiza, **Then** muestra estado vacío amigable con totales en cero, sin error.
4. **Given** un mes seleccionado en el futuro (donde aún no hay Transactions porque las recurrentes no se han ejecutado), **When** el usuario abre el modo Quincenal, **Then** ambas quincenas aparecen vacías y un mensaje claro indica que la proyección de movimientos planeados está disponible en la vista Mensual.

---

### User Story 2 - Configurar cortes personalizados de quincena (Priority: P1)

Un usuario al que le pagan en fechas distintas al calendario estándar (ej. el 30 y el 15) quiere que la app agrupe sus transacciones según SUS ciclos de cobro, no por días calendario. Activa la configuración personalizada en /settings y define los dos días de inicio de quincena.

**Why this priority**: Es la mitad del valor del feature. Sin esto, los usuarios con ciclo no-calendario (que es muy común en Colombia y el caso real del owner de la app) no obtienen una proyección útil para tomar decisiones.

**Independent Test**: Ir a /settings, activar "Cortes personalizados", poner Q1=30 y Q2=15. Volver a /budgets en modo Quincenal seleccionando el mes actual. Verificar que la primera tarjeta Q1 cubre del día 30 del mes anterior al 14 del mes actual y la segunda Q2 cubre del 15 al 29 del mes actual. Las transacciones reales del rango aparecen en la tarjeta correcta.

**Acceptance Scenarios**:

1. **Given** un usuario en /settings con la sección "Quincenas" visible, **When** activa el toggle "Personalizar mis cortes de quincena" y selecciona Q1=30, Q2=15, y guarda, **Then** la configuración se persiste asociada al usuario y se mantiene entre sesiones y dispositivos.
2. **Given** un usuario con cortes Q1=30 y Q2=15 configurados, **When** abre la vista Quincenal de mayo 2026, **Then** Q1 muestra rango "30 abr – 14 may" y Q2 muestra rango "15 may – 29 may" en sus headers.
3. **Given** la misma configuración Q1=30/Q2=15, **When** la vista carga las transacciones, **Then** una transacción del 28 de abril aparece en Q1 (porque cae en su rango), una del 5 de mayo aparece también en Q1, y una del 20 de mayo aparece en Q2.
4. **Given** un usuario con cortes personalizados activos, **When** desactiva el toggle en /settings y guarda, **Then** el sistema vuelve al modo calendario por defecto (Q1=1, Q2=16) sin requerir más acción.
5. **Given** un usuario que cambia los cortes (ej. de 30/15 a 1/16), **When** vuelve a /budgets Quincenal, **Then** la vista refleja inmediatamente la nueva agrupación sin necesidad de recargar manualmente.

---

### User Story 3 - Manejo de meses con cortes inválidos en el calendario (Priority: P2)

Si el usuario configuró un día de corte que no existe en el mes consultado (ej. día 30 en febrero), el sistema usa el último día disponible de ese mes para no romper la vista.

**Why this priority**: Mejora la robustez pero solo se manifiesta en casos puntuales (febrero, meses de 30 días). El sistema debe degradar gracefully en lugar de mostrar errores.

**Independent Test**: Configurar Q1=31 y Q2=15. Navegar a febrero 2026 (28 días). Verificar que Q1 toma como inicio el día 28 (último disponible), no rompe la vista, y los headers muestran ese rango.

**Acceptance Scenarios**:

1. **Given** cortes Q1=30, Q2=15 y el usuario navega a febrero 2026, **When** la vista carga, **Then** Q1 cubre desde el día 28 (último de enero, ya que febrero 2026 tiene 28 y enero tiene 31 → se busca el día 30 de enero, que sí existe → "30 ene – 14 feb"). Si el corte fuera 31 y el mes anterior tiene 30 días, usa el último disponible (30).
2. **Given** un corte inválido en absoluto (ej. día 32 — no debería poder configurarse, pero defensivo): el formulario lo rechaza con un mensaje en /settings y no permite guardar.

---

### User Story 4 - Vista previa del rango calculado en Settings (Priority: P2)

Cuando el usuario está configurando los cortes en /settings, ve en tiempo real una vista previa de los rangos que se calcularán para el mes actual, para confirmar que la configuración es la que quiere antes de guardar.

**Why this priority**: Reduce errores de configuración y aumenta confianza, pero la lógica funcional puede entregarse sin esto.

**Independent Test**: En /settings, ajustar los selectores Q1 y Q2 a varios valores. Verificar que debajo aparece "Para el mes actual: Q1 = <fecha> – <fecha>, Q2 = <fecha> – <fecha>" y se actualiza con cada cambio sin necesidad de guardar.

**Acceptance Scenarios**:

1. **Given** el usuario en /settings con "Cortes personalizados" activo y Q1=30, Q2=15, **When** ve la sección, **Then** debajo de los selectores aparece un texto tipo "Con esta configuración, en mayo 2026: Primera quincena 30 abr – 14 may; Segunda quincena 15 may – 29 may".
2. **Given** el usuario cambia Q1 de 30 a 1, **When** suelta el input, **Then** la vista previa se actualiza al instante reflejando los nuevos rangos.

---

### Edge Cases

- ¿Qué pasa si el usuario configura Q1=Q2 (mismo día)? El formulario lo rechaza con mensaje "Los días de inicio de quincena deben ser diferentes" y no permite guardar.
- ¿Qué pasa si un mes tiene 31 días y el corte es 30? Q1 inicia el día 30 ese mes; el día 31 entra en Q1 (es el día anterior al siguiente corte).
- ¿Qué pasa con transacciones de tipo TRANSFER? Se muestran en la vista quincenal como ingreso o gasto neutral; no afectan los totales de ingreso/gasto agregados (mismo tratamiento que ya hace el módulo de Transactions hoy).
- ¿Qué pasa con la moneda? Se asume la moneda principal del usuario (mismo comportamiento que los demás endpoints existentes).
- ¿Qué pasa si el usuario tiene transacciones de varios años pasados en el mes seleccionado? El backend filtra estrictamente por mes y año seleccionados, así no hay contaminación cruzada.
- ¿Qué pasa con transacciones sin categoría o sin cuenta? Aparecen en la vista quincenal igual, con campos vacíos en lugar de error.
- ¿Qué pasa si el cron ejecuta una recurrente justo después de cargar la página? La transacción real aparecerá en la próxima carga; no es un caso a manejar en tiempo real (refrescar manualmente lo trae).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La vista Quincenal de la página de Presupuestos MUST agrupar y mostrar SOLO transacciones reales (no movimientos programados) del mes seleccionado.
- **FR-002**: Por defecto, la primera quincena cubre días 1–15 y la segunda 16 al último día calendario del mes seleccionado, replicando el comportamiento actual.
- **FR-003**: El usuario MUST poder configurar dos días de inicio de quincena (rango 1–31) desde la página de Configuración, mediante un toggle "Personalizar mis cortes de quincena".
- **FR-004**: Cuando el toggle de personalización está desactivado, el sistema MUST usar los valores por defecto (Q1=1, Q2=16) sin importar lo que el usuario haya guardado previamente.
- **FR-005**: Cuando el toggle está activado y el usuario define Q1 y Q2 distintos, el sistema MUST calcular los rangos así:
  - Si Q1 < Q2: Q1 cubre días Q1..Q2-1 del mes seleccionado; Q2 cubre días Q2..últimoDía del mes seleccionado.
  - Si Q1 > Q2: Q1 cubre desde el día Q1 del mes anterior hasta el día Q2-1 del mes seleccionado; Q2 cubre del día Q2 al día Q1-1 del mes seleccionado.
- **FR-006**: Cuando un día de corte no existe en un mes específico (ej. 30 en febrero), el sistema MUST usar el último día calendario disponible de ese mes para el cálculo del rango.
- **FR-007**: La configuración de cortes MUST persistirse en backend, asociada al usuario autenticado, y ser consistente entre sesiones y dispositivos.
- **FR-008**: Los headers de las tarjetas Q1 y Q2 MUST mostrar el rango real de fechas calculado (ej. "30 abr – 14 may"), no etiquetas genéricas.
- **FR-009**: Cada item listado en una quincena MUST corresponder a una transacción real con: fecha exacta, descripción, monto, categoría, cuenta (cuando aplique), tipo (ingreso/gasto/transferencia).
- **FR-010**: Los totales de cada quincena MUST calcularse como: total ingresos = suma de Transactions tipo INCOME; total gastos = suma de Transactions tipo EXPENSE; balance neto = ingresos - gastos. Las transferencias se listan pero NO afectan ingresos/gastos agregados.
- **FR-011**: La sección visualmente debe llamarse "Cash flow por quincena" o equivalente que refleje "movimientos reales", no "Proyección por quincena".
- **FR-012**: La validación del formulario de cortes MUST impedir Q1=Q2, valores fuera de 1–31, o no numéricos.
- **FR-013**: Cuando una quincena no tiene transacciones reales, el sistema MUST mostrar estado vacío amigable y totales en cero, sin error.
- **FR-014**: Cuando el mes seleccionado es futuro y no hay transacciones reales, la vista MUST mostrar un mensaje claro distinto al estado vacío estándar — del tipo: "Las transacciones de este mes aún no se han registrado. Programa tus pagos en Movimientos programados o consulta la vista Mensual para la proyección."
- **FR-015**: La vista Quincenal MUST adaptarse a dark/light mode y a viewports móvil/tablet/escritorio sin desbordes.
- **FR-016**: Los datos del cash flow quincenal MUST estar disponibles vía consulta programática en una forma que un futuro agente de IA pueda interrogar por rangos de fecha y por quincena, sin transformación adicional en cliente.
- **FR-017**: Cambiar la configuración de cortes en /settings MUST reflejarse de inmediato en la vista de /budgets Quincenal al volver a abrirla, sin requerir cierre de sesión.
- **FR-018**: La sección Quincenas en /settings MUST mostrar una vista previa en tiempo real del rango calculado para el mes actual, basada en los valores actuales de los selectores antes de guardar.

### Key Entities

- **UserBiweeklyConfig**: representa la preferencia del usuario para los cortes de quincena. Atributos: identificador del usuario, modo (calendario default vs personalizado), día de inicio de Q1, día de inicio de Q2, fecha del último cambio. Es 1:1 con el usuario, persistido en backend.
- **BiweeklyCashflow** (vista derivada, no persistida): conjunto de transacciones reales del mes seleccionado agrupadas en dos buckets según los cortes configurados, con rangos de fecha calculados, lista de transacciones por bucket y totales por bucket. Se calcula a demanda.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario sin configuración personalizada ve sus transacciones reales agrupadas correctamente en Q1 (1–15) y Q2 (16–fin) del mes actual, sin necesidad de tocar settings.
- **SC-002**: Un usuario que configura Q1=30 y Q2=15 ve correctamente Q1 cubriendo "día 30 mes anterior – día 14 mes actual" y Q2 cubriendo "día 15 – día 29 mes actual" en el mes seleccionado.
- **SC-003**: Para meses con 28 o 29 días (febrero), un corte configurado mayor que el último día se ajusta al último día disponible sin romper la vista.
- **SC-004**: La suma de ingresos, gastos y balance neto mostrada en cada quincena coincide con la suma manual de las transacciones reales listadas en esa quincena.
- **SC-005**: El cambio de configuración en /settings se refleja en /budgets Quincenal en menos de 2 segundos al volver a la página.
- **SC-006**: Cero regresiones en otras vistas (vista Mensual de /budgets, /transactions, /analytics) tras desplegar el feature.
- **SC-007**: Los datos del cash flow quincenal son consultables por un agente IA futuro vía API con shape estable.

## Assumptions

- Las transacciones reales (Transaction) ya existen en la app y tienen fecha exacta (`date`).
- La página /settings ya existe y se le puede agregar una nueva sección sin reorganizar el layout.
- La página /budgets ya tiene los modos Mensual/Quincenal (release v009); este feature solo modifica el contenido del modo Quincenal y los headers.
- Los usuarios objetivo entienden el concepto de "ciclo de cobro" y son capaces de definir dos días numéricos para sus cortes.
- No se introduce versionado del catálogo de cortes; solo se almacena la configuración actual del usuario.
- El idioma único de este release es español.
