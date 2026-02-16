# Primeros Pasos

> [Inicio](../README.md) > Introducción > Primeros Pasos

## Prerequisitos

- **Node.js** 18+ (recomendado 20+)
- **npm** (incluido con Node.js)
- **Git**
- Acceso al repositorio `marketpaper-demo`
- Variables de entorno (pedir a un admin del equipo)

## Setup del entorno

### 1. Clonar el repositorio

```bash
git clone <url-del-repo> marketpaper-demo
cd marketpaper-demo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase (obligatorias)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Cifrado (obligatoria)
ENCRYPTION_KEY=<64 caracteres hex>

# Nexus AI (opcional, para desarrollo de Nexus)
NEXT_PUBLIC_NEXUS_API_URL=http://localhost:3002

# Slack (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

> **Importante**: Las variables `NEXT_PUBLIC_*` son accesibles desde el browser. Las demás son solo server-side. Ver [Variables de Entorno](../referencias/variables-entorno.md) para el listado completo.

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu browser.

> **ALERTA**: La base de datos conectada es de **producción**. No hay staging. Los datos de clientes activos (INTED) son reales. Nunca ejecutar operaciones destructivas.

## Comandos principales

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm test` | Vitest en modo watch |
| `npm run test:run` | Vitest una sola ejecución |
| `npm run gen:types` | Regenerar tipos TypeScript desde Supabase |

## Estructura rápida del proyecto

```
app/                    → Rutas y páginas (Next.js App Router)
  (workspace)/workspace/  → Módulos del workspace
  admin/                  → Panel de super admin
  api/                    → API routes (~70 endpoints)
  client-view/            → Portal de cliente (viewer)
  login/, register/       → Autenticación

components/             → Componentes React reutilizables
  ui/                     → Componentes base (shadcn/ui)
  admin/                  → Componentes del panel admin
  nexus/                  → Componentes de Nexus AI

lib/                    → Lógica de negocio
  auth-client.ts          → Auth para componentes client
  auth-server.ts          → Auth para API routes / Server Components
  auth-types.ts           → Tipos y permisos compartidos
  encryption.ts           → Cifrado AES-256-GCM
  nexus/                  → Cliente de Nexus AI

utils/supabase/         → Clientes de Supabase
supabase/migrations/    → Migraciones SQL
```

Ver [Estructura del Proyecto](../guias/estructura-proyecto.md) para el detalle completo.

## Flujo de login

1. El usuario accede a `/login` e ingresa credenciales
2. Supabase Auth valida y crea una sesión (cookie)
3. El middleware intercepta la siguiente request
4. Según el rol:
   - `super_admin` → redirige a `/admin`
   - `viewer` con `client_id` → redirige a `/client-view`
   - Usuario con `company_id` activo → redirige a `/workspace?company_id=xxx`
   - Sin perfil completo → redirige a `/setup`

## Siguientes lecturas

- [Conceptos Clave](conceptos-clave.md) - Entender multi-tenancy, roles, RLS
- [Estructura del Proyecto](../guias/estructura-proyecto.md) - Dónde está cada cosa
- [Patrones de Código](../guias/patrones-codigo.md) - Cómo escribir código en FOMO
