# Finanzas App - Gestion de Finanzas Personales

Aplicacion web completa para gestion de finanzas personales con dashboard interactivo, seguimiento de gastos e ingresos, presupuestos mensuales, transacciones recurrentes, inversiones, analisis financiero inteligente y reportes exportables.

## Stack Tecnologico

### Backend
- **Node.js 20 LTS** + **Express.js** + **TypeScript**
- **PostgreSQL** con **Prisma ORM**
- **JWT** (access + refresh tokens) + **bcrypt**
- **Zod** para validacion de schemas
- **Swagger/OpenAPI 3.0** en `/api/docs`
- **Jest** + **Supertest** para testing

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (modo oscuro/claro)
- **Recharts** para graficas
- **Zustand** para estado global
- **Axios** con interceptores y refresh automatico
- **React Router v6**

### Infraestructura
- **Docker** + **Docker Compose**
- **ESLint** + **Prettier**

---

## Requisitos Previos

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/) y Docker Compose (para ejecucion con contenedores)
- [PostgreSQL 16+](https://www.postgresql.org/) (solo si ejecutas sin Docker)

---

## Inicio Rapido con Docker

```bash
# Clonar el repositorio
git clone https://github.com/dilan987/app-finanzas.git
cd app-finanzas

# Levantar todo el stack (backend + frontend + PostgreSQL)
docker-compose up --build
```

> **Nota:** La primera vez tardara unos minutos en descargar las imagenes de Docker y compilar los contenedores. Asegurate de tener Docker Desktop corriendo antes de ejecutar el comando.

La aplicacion estara disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api
- **Swagger Docs:** http://localhost:4000/api/docs
- **PostgreSQL:** localhost:5432

**Credenciales de acceso:**
- Email: `admin@admin.com`
- Password: `admin`

---

## Instalacion Manual (sin Docker)

### 1. Base de datos

Instala PostgreSQL y crea una base de datos:

```sql
CREATE DATABASE finanzas_db;
CREATE USER finanzas_user WITH PASSWORD 'finanzas_pass_dev';
GRANT ALL PRIVILEGES ON DATABASE finanzas_db TO finanzas_user;
```

### 2. Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Ejecutar seed (categorias por defecto + usuario de prueba)
npm run prisma:seed

# Iniciar en modo desarrollo
npm run dev
```

### 3. Frontend

```bash
cd frontend

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexion a PostgreSQL | `postgresql://user:pass@localhost:5432/finanzas_db` |
| `JWT_ACCESS_SECRET` | Secret para access tokens (min 64 chars) | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens (min 64 chars) | `openssl rand -base64 64` |
| `PORT` | Puerto del servidor | `4000` |
| `NODE_ENV` | Entorno | `development` / `production` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` |
| `SMTP_HOST` | Host del servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | `tu@email.com` |
| `SMTP_PASS` | Password SMTP | `app_password` |
| `SMTP_FROM` | Email remitente | `noreply@finanzas.app` |

### Frontend (`frontend/.env`)

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:4000/api` |

---

## Estructura del Proyecto

```
finanzas-app/
├── docker-compose.yml          # Orquestacion de servicios
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de datos
│   │   └── seed.ts             # Datos iniciales
│   └── src/
│       ├── config/             # Configuracion (env, DB, Swagger)
│       ├── middlewares/        # Auth, errores, rate limit, validacion
│       ├── modules/            # Modulos de negocio
│       │   ├── auth/           # Autenticacion (JWT + refresh)
│       │   ├── users/          # Gestion de perfil
│       │   ├── categories/     # Categorias de transacciones
│       │   ├── transactions/   # CRUD de ingresos/gastos
│       │   ├── budgets/        # Presupuestos mensuales
│       │   ├── recurring/      # Transacciones recurrentes
│       │   ├── investments/    # Modulo de inversiones
│       │   ├── analytics/      # Analisis financiero
│       │   └── reports/        # Exportacion PDF/CSV
│       ├── utils/              # Helpers y errores
│       └── types/              # Tipos compartidos
└── frontend/
    └── src/
        ├── api/                # Capa de comunicacion con backend
        ├── components/
        │   ├── ui/             # Componentes reutilizables
        │   ├── layout/         # Layout principal (Sidebar, Header)
        │   ├── charts/         # Graficas (Recharts)
        │   └── forms/          # Formularios reutilizables
        ├── pages/              # Paginas de la aplicacion
        ├── store/              # Estado global (Zustand)
        ├── hooks/              # Custom hooks
        ├── utils/              # Utilidades
        ├── types/              # Tipos TypeScript
        └── routes/             # Configuracion de rutas
```

---

## Endpoints de la API

### Autenticacion (`/api/auth`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/register` | Registro de usuario |
| POST | `/login` | Inicio de sesion |
| POST | `/refresh` | Renovar access token |
| POST | `/logout` | Cerrar sesion |
| POST | `/forgot-password` | Solicitar recuperacion |
| POST | `/reset-password` | Restablecer contrasena |

### Usuarios (`/api/users`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/profile` | Obtener perfil |
| PUT | `/profile` | Actualizar perfil |
| PUT | `/change-password` | Cambiar contrasena |
| DELETE | `/account` | Eliminar cuenta |

### Categorias (`/api/categories`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/` | Listar categorias |
| GET | `/:id` | Detalle de categoria |
| POST | `/` | Crear categoria |
| PUT | `/:id` | Actualizar categoria |
| DELETE | `/:id` | Eliminar categoria |

### Transacciones (`/api/transactions`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/` | Listar con filtros y paginacion |
| GET | `/stats/monthly` | Estadisticas mensuales |
| GET | `/:id` | Detalle de transaccion |
| POST | `/` | Crear transaccion |
| PUT | `/:id` | Actualizar transaccion |
| DELETE | `/:id` | Eliminar transaccion |

### Presupuestos (`/api/budgets`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/` | Listar presupuestos |
| GET | `/summary` | Resumen con gastos reales |
| GET | `/:id` | Detalle de presupuesto |
| POST | `/` | Crear presupuesto |
| PUT | `/:id` | Actualizar presupuesto |
| DELETE | `/:id` | Eliminar presupuesto |

### Recurrentes (`/api/recurring`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/` | Listar recurrentes |
| GET | `/:id` | Detalle |
| POST | `/` | Crear recurrente |
| PUT | `/:id` | Actualizar |
| PATCH | `/:id/toggle` | Activar/pausar |
| DELETE | `/:id` | Eliminar |
| POST | `/process` | Procesar recurrentes pendientes |

### Inversiones (`/api/investments`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/` | Listar inversiones |
| GET | `/summary` | Resumen del portafolio |
| GET | `/:id` | Detalle de inversion |
| POST | `/` | Crear inversion |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |

### Analisis (`/api/analytics`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/summary` | Resumen financiero del mes |
| GET | `/category-breakdown` | Desglose por categoria |
| GET | `/trend` | Tendencia de ultimos meses |
| POST | `/generate-recommendations` | Generar recomendaciones |
| GET | `/recommendations` | Listar recomendaciones |
| PATCH | `/recommendations/:id/read` | Marcar como leida |

### Reportes (`/api/reports`)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/pdf` | Descargar reporte PDF mensual |
| GET | `/csv` | Exportar transacciones a CSV |

---

## Funcionalidades Principales

- **Dashboard interactivo** con graficas de ingresos/gastos, distribucion por categoria, tendencia de 6 meses
- **CRUD completo de transacciones** con filtros avanzados, paginacion y busqueda
- **Categorias personalizables** con iconos y colores
- **Presupuestos mensuales** con barras de progreso y alertas visuales
- **Transacciones recurrentes** con procesamiento automatico
- **Modulo de inversiones** con seguimiento de rendimiento
- **Analisis financiero inteligente** con recomendaciones basadas en reglas (50/30/20)
- **Reportes exportables** en PDF y CSV
- **Modo oscuro/claro** persistente
- **Autenticacion segura** con JWT + refresh tokens en httpOnly cookies

## Seguridad

- Contrasenas hasheadas con bcrypt (12 salt rounds)
- JWT con access token (15 min) + refresh token (7 dias) en httpOnly cookie
- Rate limiting en endpoints de autenticacion
- Helmet.js para headers de seguridad
- CORS restringido a origenes configurados
- Validacion de todas las entradas con Zod
- Queries parametrizadas via Prisma (prevencion de SQL injection)
- Manejo global de errores sin exponer informacion interna

## Scripts Utiles

```bash
# Backend
npm run dev              # Desarrollo con hot reload
npm run build            # Compilar TypeScript
npm run test             # Ejecutar tests
npm run prisma:studio    # Explorar base de datos

# Frontend
npm run dev              # Desarrollo con Vite
npm run build            # Build de produccion
npm run test             # Ejecutar tests
npm run preview          # Preview del build
```

## Modelo de Datos

Entidades principales: User, Category, Transaction, Budget, RecurringTransaction, Investment, Recommendation, RefreshToken, PasswordResetToken.

Consulta el schema completo en `backend/prisma/schema.prisma`.

---

## Licencia

Proyecto privado de uso personal.
