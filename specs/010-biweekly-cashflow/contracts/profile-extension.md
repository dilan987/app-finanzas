# API Contract — Profile Extension (biweekly config)

Base: `/api/users/profile`. Endpoints existentes; este documento describe los campos nuevos.

---

## `GET /api/users/profile`

Response 200 — payload extendido:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "mainCurrency": "COP",
    "timezone": "America/Bogota",
    "tourStatus": "COMPLETED",
    "tourVersion": "1",
    "tourUpdatedAt": "...",
    "biweeklyCustomEnabled": false,
    "biweeklyStartDay1": null,
    "biweeklyStartDay2": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## `PUT /api/users/profile`

Body:

```json
{
  "biweeklyCustomEnabled": true,
  "biweeklyStartDay1": 30,
  "biweeklyStartDay2": 15
}
```

Esquema Zod añade:

```ts
biweeklyCustomEnabled: z.boolean().optional(),
biweeklyStartDay1: z.number().int().min(1).max(31).nullable().optional(),
biweeklyStartDay2: z.number().int().min(1).max(31).nullable().optional(),
```

Refinamiento:
- Si `biweeklyCustomEnabled === true` → `biweeklyStartDay1` y `biweeklyStartDay2` son requeridos, distintos, en rango 1–31.
- Si `biweeklyCustomEnabled === false` → los días pueden ser `null` o conservarse.
- Si los días vienen sin `biweeklyCustomEnabled`, se actualizan los días pero no se cambia el modo.

Errores:
- 422 si `biweeklyCustomEnabled=true` y faltan días.
- 422 si día1 = día2 con custom enabled.
- 422 si día fuera de 1–31.
- 401 sin auth.

## Tests (backend)

- PUT activa custom con 30/15 → 200, persistido, GET refleja.
- PUT activa custom sin días → 422.
- PUT con día1=día2=15 + custom enabled → 422.
- PUT desactiva custom → 200, los días quedan tal cual o limpios.
- PUT solo cambia `name` → biweekly fields inalterados.
