# API Contract — Onboarding Tour

Base path: `/api/onboarding`. Todos los endpoints requieren JWT Bearer (middleware `authenticate`). Respuestas siguen el wrapper estándar `ApiResponse<T>`.

```ts
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};
```

`TourStatus = 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED'`.

---

## 1. `GET /api/onboarding/tour`

Devuelve el estado del tour del usuario autenticado.

### Request

- Headers: `Authorization: Bearer <accessToken>`
- Body: ninguno
- Query: ninguno

### Response 200

```json
{
  "success": true,
  "data": {
    "status": "NOT_STARTED",
    "version": null,
    "updatedAt": null
  },
  "message": "Tour state retrieved"
}
```

Esquema TS:

```ts
interface OnboardingStateResponse {
  status: TourStatus;
  version: string | null;
  updatedAt: string | null; // ISO 8601
}
```

### Errores

| Código | Causa |
|--------|-------|
| 401 | Falta o token inválido |
| 404 | Usuario no encontrado (caso defensivo; no debe ocurrir si el JWT es válido) |

---

## 2. `PATCH /api/onboarding/tour`

Actualiza el estado del tour para el usuario autenticado.

### Request

- Headers: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`

```json
{
  "status": "COMPLETED",
  "version": "1"
}
```

Esquema Zod (backend):

```ts
const patchTourSchema = z.object({
  status: z.enum(['NOT_STARTED', 'COMPLETED', 'SKIPPED']),
  version: z.string().min(1).max(16).nullable().optional(),
});
```

Reglas:

- Si `status === 'NOT_STARTED'`: `version` será forzado a `null` por el service (caso reinicio).
- Si `status` ∈ `{COMPLETED, SKIPPED}`: `version` es **requerido** (string no vacío). Si falta → 422.

### Response 200

```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "version": "1",
    "updatedAt": "2026-04-27T12:34:56.000Z"
  },
  "message": "Tour state updated"
}
```

### Errores

| Código | Causa |
|--------|-------|
| 401 | Falta o token inválido |
| 422 | Validación Zod (status fuera del enum, version requerido y faltante, etc.) |
| 404 | Usuario no encontrado |
| 500 | Error inesperado |

---

## 3. Notas de seguridad

- El `userId` siempre proviene de `req.user.id` (middleware `authenticate`). El payload jamás incluye `userId`.
- No hay endpoints `DELETE` ni `POST` para este recurso: el ciclo de vida se cubre con `GET`/`PATCH`.
- Rate limiting: hereda el limiter global; no requiere uno específico (uso esperado: 1-2 llamadas por sesión).

## 4. Casos cubiertos por tests (backend)

- `GET` devuelve `NOT_STARTED` para un usuario recién creado.
- `PATCH` con `status=COMPLETED` y `version="1"` persiste y devuelve el estado.
- `PATCH` con `status=COMPLETED` sin `version` → 422.
- `PATCH` con `status=NOT_STARTED` ignora `version` recibida (queda `null`).
- `PATCH` con `status` inválido → 422.
- Sin token → 401.
- Aislamiento: usuario A no puede leer ni modificar el estado de B (no hay forma de pasar otro userId; test verifica que dos usuarios concurrentes mantienen estados independientes).
- `PATCH` con `status=SKIPPED` y `version="1"` persiste correctamente.
