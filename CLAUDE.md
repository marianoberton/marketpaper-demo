# FOMO Platform

## Descripción del proyecto

FOMO Platform es una plataforma empresarial B2B SaaS multi-tenant. Cada tenant es una empresa cliente que gestiona su información, herramientas operativas y relación con sus propios clientes desde un workspace centralizado.

**Jerarquía de acceso:**
- **Super Admin** (equipo FOMO): administra toda la plataforma, empresas, módulos y plantillas
- **Empresa (tenant)**: cada empresa tiene su workspace aislado con módulos habilitados
- **Usuarios de empresa**: roles internos (owner, admin, manager, employee)
- **Viewer**: acceso de solo lectura para clientes finales de las empresas

**Nombre del repo**: `marketpaper-demo`
**Nombre comercial**: FOMO Platform
**Deploy target**: Vercel

---

## ALERTA: Entorno de producción

> **LA BASE DE DATOS CONECTADA ES DE PRODUCCIÓN.** No existe un entorno de staging separado.
> Todas las operaciones contra Supabase afectan datos reales de clientes.

### Datos protegidos: INTED

La empresa **INTED** es un cliente activo cuyos usuarios finales están usando la plataforma en este momento. Sus datos son intocables:

- **NUNCA** modificar, eliminar ni alterar datos de INTED (proyectos, documentos, usuarios, configuración)
- **NUNCA** ejecutar migraciones destructivas (`DROP TABLE`, `DELETE FROM`, `TRUNCATE`) sin verificar que no afecten a INTED ni a ningún tenant activo
- **NUNCA** ejecutar scripts de limpieza o seed que puedan sobrescribir datos existentes
- Antes de cualquier migración SQL, verificar que usa `IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, o es puramente aditiva
- Si una migración necesita modificar estructura existente, confirmar con el usuario antes de aplicarla
- Al probar funcionalidades nuevas, usar una empresa de test, nunca datos de INTED

### Reglas para migraciones en producción
1. Solo migraciones **aditivas**: crear tablas, agregar columnas, crear índices, agregar políticas RLS
2. Si hay que modificar una columna existente o eliminar algo, **siempre preguntar primero**
3. Nunca asumir que se puede hacer `DROP` o `DELETE` de algo — preguntar
4. Hacer backup mental de qué tablas/columnas se van a tocar y confirmar el impacto

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, TypeScript (strict mode) |
| Estilos | Tailwind CSS v4, CSS variables |
| Componentes | shadcn/ui (estilo New York), Radix UI |
| Iconos | lucide-react |
| Base de datos | Supabase (PostgreSQL 17) con RLS |
| Auth | Supabase Auth (cookies SSR) |
| Storage | Supabase Storage + Vercel Blob |
| Charts | Recharts |
| Notificaciones | sonner (toast) |
| Temas | next-themes (claro/oscuro) |
| Testing | Vitest + Testing Library + jsdom |
| Integraciones | HubSpot API, LangChain, OpenAI |
| Cifrado | AES-256-GCM (credenciales de integración) |

---

## Comandos de desarrollo

```bash
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # ESLint
npm test             # Vitest en modo watch
npm run test:run     # Vitest una sola ejecución
npm run gen:types    # Regenerar tipos TypeScript desde Supabase
```

---

## Estructura del proyecto

```
├── app/                        # Next.js App Router
│   ├── (workspace)/workspace/  # Rutas del workspace (route group)
│   │   ├── construccion/       # Módulo de construcción
│   │   ├── crm/                # Módulo CRM
│   │   ├── finanzas/           # Módulo financiero
│   │   ├── temas/              # Gestión de temas/expedientes
│   │   ├── tareas/             # Tareas asignadas al usuario
│   │   ├── cotizador/          # Cotizaciones
│   │   ├── ventas/             # Pipeline de ventas (Kanban)
│   │   ├── soporte/            # Tickets de soporte
│   │   ├── hubspot/            # Analytics HubSpot
│   │   └── settings/           # Configuración del workspace
│   ├── admin/                  # Panel de super admin
│   ├── api/                    # API routes (~70 endpoints)
│   │   ├── admin/              # APIs de administración
│   │   ├── auth/               # APIs de autenticación
│   │   ├── workspace/          # APIs del workspace (multi-tenant)
│   │   ├── storage/            # APIs de archivos
│   │   ├── webhook/            # Webhooks externos
│   │   └── knowledge/          # RAG / base de conocimiento
│   ├── login/                  # Página de login
│   ├── register/               # Registro empresarial
│   ├── client-view/            # Portal de cliente (viewer)
│   └── layout.tsx              # Layout raíz (ThemeProvider, LayoutProvider, Toaster)
├── components/                 # Componentes React
│   ├── ui/                     # Componentes base shadcn/ui
│   ├── admin/                  # Componentes del panel admin
│   ├── workspace-layout.tsx    # Layout principal del workspace
│   ├── workspace-nav.tsx       # Navegación dinámica por features
│   ├── workspace-context.tsx   # Context de empresa/workspace
│   └── layout-context.tsx      # Context de preferencias de UI
├── lib/                        # Lógica de negocio y utilidades
│   ├── auth-client.ts          # Auth para componentes client
│   ├── auth-server.ts          # Auth para server/API routes
│   ├── auth-types.ts           # Tipos y permisos compartidos
│   ├── crm-multitenant.ts      # CRM con aislamiento multi-tenant
│   ├── construction.ts         # Tipos del módulo construcción
│   ├── super-admin.ts          # Operaciones de super admin
│   ├── encryption.ts           # Cifrado AES-256-GCM
│   ├── hubspot.ts              # Integración HubSpot
│   ├── database.types.ts       # Tipos auto-generados de Supabase
│   ├── crm/                    # Submódulos CRM
│   ├── rag/                    # Sistema RAG
│   └── __tests__/              # Tests unitarios
├── utils/supabase/             # Clientes Supabase
│   ├── client.ts               # Cliente para el browser
│   ├── server.ts               # Cliente para el server
│   └── middleware.ts            # Gestión de sesiones
├── hooks/                      # Custom React hooks
├── types/                      # Definiciones TypeScript
├── actions/                    # Server actions
├── supabase/                   # Configuración Supabase
│   ├── config.toml             # Config local de Supabase
│   └── migrations/             # Migraciones SQL (34+)
├── scripts/                    # Scripts utilitarios
├── public/                     # Assets estáticos
├── middleware.ts                # Middleware de auth y routing
└── memory-bank/                # Documentación de contexto del proyecto
```

---

## Arquitectura multi-tenant

### Modelo de aislamiento

Toda la data se aísla por `company_id`. Cada tabla que contiene datos de empresa **debe** incluir una columna `company_id UUID REFERENCES companies(id)`.

### Roles de usuario

Definidos en `lib/auth-types.ts`:

```
super_admin > company_owner > company_admin > manager > employee > viewer
```

| Rol | Acceso |
|-----|--------|
| `super_admin` | Toda la plataforma, panel /admin |
| `company_owner` | Su empresa completa, facturación |
| `company_admin` | Su empresa, gestión de usuarios |
| `manager` | Lectura/escritura en su empresa |
| `employee` | Lectura/escritura limitada |
| `viewer` | Solo lectura, portal /client-view |

### RLS (Row Level Security) - Patrón de 3 capas

Toda tabla sensible usa este patrón:

```sql
-- Capa 1: Super admin - acceso total
CREATE POLICY "Super admins full access" ON tabla
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Capa 2: Admin de empresa - su empresa
CREATE POLICY "Company admins manage" ON tabla
  FOR ALL
  USING (company_id = get_user_company_id() AND is_company_admin())
  WITH CHECK (company_id = get_user_company_id() AND is_company_admin());

-- Capa 3: Usuarios - lectura de su empresa
CREATE POLICY "Users read own company" ON tabla
  FOR SELECT
  USING (is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = get_user_company_id()));
```

### Helper functions SQL (SECURITY DEFINER)

```sql
is_super_admin()         -- ¿Es super admin?
is_company_admin()       -- ¿Es admin de su empresa?
get_user_company_id()    -- UUID de la empresa del usuario
get_user_role()          -- Rol del usuario actual
```

---

## Patrones de autenticación

### Separación client/server (CRÍTICO)

La autenticación está dividida en tres archivos. **Nunca mezclar imports**:

| Archivo | Usar desde | Importa |
|---------|-----------|---------|
| `lib/auth-client.ts` | Componentes `'use client'` | `utils/supabase/client` |
| `lib/auth-server.ts` | API routes, Server Components | `utils/supabase/server` |
| `lib/auth-types.ts` | Cualquier lugar | Solo tipos y constantes |

```typescript
// ✅ Correcto en un componente client
import { getCurrentUserClient } from '@/lib/auth-client'

// ✅ Correcto en una API route
import { getCurrentUser } from '@/lib/auth-server'

// ❌ NUNCA hacer esto en un componente client
import { getCurrentUser } from '@/lib/auth-server' // Error: usa next/headers
```

### Middleware de routing

`middleware.ts` intercepta todas las rutas protegidas y redirige según el rol:

- `/workspace` → requiere usuario con `company_id`
- `/admin` → requiere `super_admin` activo
- `/client-view` → requiere rol `viewer` con `client_id`
- Sin perfil → `/setup`

### Clientes Supabase

| Cliente | Archivo | Uso |
|---------|---------|-----|
| Browser | `utils/supabase/client.ts` | Componentes client |
| Server | `utils/supabase/server.ts` | API routes, Server Components |
| Admin | `lib/supabaseAdmin.ts` | Operaciones con service_role (bypass RLS) |

---

## Patrones de código obligatorios

### Server Components por defecto
- Usar `'use client'` solo cuando se necesite interactividad (useState, useEffect, onClick, etc.)
- Los layouts y wrappers de datos deben ser Server Components
- El patrón de referencia es `workspace-page-wrapper.tsx`: fetch en server, props a client

### API Routes
Toda API route debe:
1. Autenticar al usuario con `getCurrentUser()` desde `auth-server`
2. Obtener `company_id` del perfil del usuario (no del query param, excepto super_admin)
3. Filtrar queries por `company_id`
4. Retornar 401 si no autenticado, 403 si no autorizado

```typescript
// Patrón estándar de API route
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  // Super admin puede acceder a cualquier empresa
  const companyId = profile.role === 'super_admin'
    ? searchParams.get('company_id') || profile.company_id
    : profile.company_id

  const { data } = await supabase
    .from('tabla')
    .select('*')
    .eq('company_id', companyId)

  return NextResponse.json(data)
}
```

### Nuevas tablas
Al crear una tabla nueva:
1. Incluir `company_id UUID REFERENCES companies(id)` (excepto tablas globales)
2. Habilitar RLS: `ALTER TABLE nueva_tabla ENABLE ROW LEVEL SECURITY;`
3. Aplicar el patrón de 3 capas de RLS
4. Crear índice en `company_id`
5. Agregar migración en `supabase/migrations/` con número secuencial

### Cifrado de credenciales
Las API keys de integraciones (HubSpot, OpenAI, etc.) se cifran con AES-256-GCM:
- Cifrar con `encryptSecret()` / `encryptCredentials()` de `lib/encryption.ts`
- Almacenar `encrypted_credentials` + `credentials_iv` en `company_integrations`
- Descifrar **solo en server-side** con `decryptSecret()` / `decryptCredentials()`
- Nunca enviar credenciales descifradas al client

### Navegación del workspace
Los módulos visibles dependen del array `features[]` de la empresa. La navegación se filtra dinámicamente en `workspace-nav.tsx`. Al agregar un módulo nuevo:
1. Crear la ruta en `app/(workspace)/workspace/nuevo-modulo/`
2. Crear las API routes correspondientes en `app/api/workspace/nuevo-modulo/`
3. Agregar el feature flag en la configuración de la empresa
4. Agregar la entrada de navegación en `workspace-nav.tsx`

---

## Base de datos

### Convenciones de migraciones
- Ubicación: `supabase/migrations/`
- Formato: `NNNN_descripcion.sql` (ej: `0035_create_nueva_tabla.sql`)
- Número secuencial incremental desde la última migración existente
- Incluir `CREATE TABLE`, `ALTER TABLE ENABLE ROW LEVEL SECURITY`, políticas RLS e índices

### Regenerar tipos TypeScript
Después de cambiar el schema, ejecutar:
```bash
npm run gen:types
```
Esto actualiza `lib/database.types.ts` con los tipos de Supabase.

### Tablas principales

| Tabla | Propósito |
|-------|-----------|
| `companies` | Empresas/tenants |
| `user_profiles` | Usuarios, roles, permisos |
| `super_admins` | Super administradores |
| `projects` | Proyectos de construcción |
| `clients` | Clientes de las empresas |
| `project_documents` | Documentos de proyectos |
| `unified_leads` | Leads CRM unificados multi-canal |
| `contacts` | Contactos CRM |
| `activities` | Actividades CRM |
| `temas` | Temas/expedientes |
| `tema_tasks` | Tareas dentro de temas |
| `support_tickets` | Tickets de soporte |
| `expenses` | Gastos financieros |
| `company_integrations` | Credenciales cifradas de integraciones |
| `company_invitations` | Invitaciones a usuarios |

---

## UI/UX

### Componentes
- Base: **shadcn/ui** (estilo New York) con componentes en `components/ui/`
- Agregar componentes nuevos con: `npx shadcn@latest add [componente]`
- Los componentes de shadcn se personalizan directamente en `components/ui/`

### Estilos
- **Tailwind CSS v4** con CSS custom properties definidas en `app/globals.css`
- Usar `cn()` de `lib/utils.ts` para combinar clases condicionalmente
- No usar CSS modules ni styled-components

### Tema claro/oscuro
- Gestionado por `next-themes` a través de `ThemeProvider`
- Los colores se definen como CSS variables en `globals.css` dentro de `:root` y `.dark`
- Paleta principal: `--primary` (lime #CED600), `--accent` (orange #EE9B00)

### Fuentes
- **Manrope**: headings (peso 400-800)
- **Karla**: body text (peso 400-700)
- **Concert One**: decorativa (logo)

### Notificaciones
- Usar `toast` de `sonner` para feedback al usuario
- Toast de éxito, error e info según el contexto

### Iconos
- Usar exclusivamente `lucide-react`
- Importar individualmente: `import { IconName } from 'lucide-react'`

---

## Sistema de diseño del Panel Admin

El panel de administración (`/admin`) utiliza un sistema de diseño unificado basado en CSS variables para garantizar consistencia visual en ambos temas (claro/oscuro).

### Paleta de colores

#### Tema oscuro (`.dark`)
| Variable | Color | Uso |
|----------|-------|-----|
| `--background` | `#1a1a1a` | Fondo principal del layout |
| `--card` | `#272727` | Fondo de cards y superficies elevadas |
| `--foreground` | `#fafafa` | Texto principal |
| `--muted-foreground` | `#999999` | Texto secundario, descripciones |
| `--primary` | `#ced600` | Acento lime (botones, bordes activos) |
| `--primary-foreground` | `#1a1a1a` | Texto sobre fondos primary |
| `--border` | `#3d3d3d` | Bordes de cards, divisores |
| `--muted` | `#333333` | Fondos sutiles, hover states |
| `--destructive` | `#dc2626` | Estados de error, acciones destructivas |

#### Tema claro (`:root`)
Los mismos tokens semánticos con valores apropiados para modo claro definidos en `globals.css`.

### Patrones de componentes

#### Stat Cards (tarjetas de métricas)
Todas las stat cards del admin usan un estilo uniforme:

```tsx
<Card className="border-l-4 border-l-primary">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Label</p>
        <p className="text-2xl font-bold">Value</p>
      </div>
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-8 w-8 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>
```

Para estados urgentes/críticos, usar `border-l-destructive` en lugar de `border-l-primary`.

#### Cards de contenido
```tsx
<div className="bg-card rounded-xl border border-border hover:border-primary transition-all">
  {/* Header */}
  <div className="p-5 border-b border-border">...</div>
  {/* Body */}
  <div className="p-5">...</div>
  {/* Footer */}
  <div className="p-4 bg-muted/50 rounded-b-xl border-t border-border">...</div>
</div>
```

#### Badges
| Tipo | Clases | Uso |
|------|--------|-----|
| Neutro | `variant="secondary"` | Estados por defecto |
| Outline | `variant="outline"` | Información secundaria |
| Destacado | `bg-primary/10 text-primary border-primary/20` | Estados activos, destacados |
| Error | `bg-destructive/10 text-destructive border-destructive/20` | Errores, urgente |

#### Botones
| Tipo | Variante | Uso |
|------|----------|-----|
| Primario | `className="bg-primary text-primary-foreground hover:bg-primary/90"` | Acción principal |
| Secundario | `variant="outline"` | Acciones secundarias |
| Destructivo | `variant="ghost" className="text-destructive"` | Logout, eliminar |

### Convenciones de texto

| Elemento | Clase |
|----------|-------|
| Títulos principales | `text-foreground font-bold` |
| Subtítulos | `text-foreground font-semibold` |
| Texto de cuerpo | `text-foreground` |
| Texto secundario | `text-muted-foreground` |
| Labels pequeños | `text-xs text-muted-foreground uppercase tracking-wider` |

### Convenciones de fondos

| Elemento | Clase |
|----------|-------|
| Layout principal | `bg-background` |
| Cards/superficies | `bg-card` |
| Fondos sutiles | `bg-muted` o `bg-muted/50` |
| Hover states | `hover:bg-muted` |
| Fondos de acento | `bg-primary/10` |

### Archivos del sistema de diseño

| Archivo | Propósito |
|---------|-----------|
| `app/globals.css` | Variables CSS del tema (`:root`, `.dark`) |
| `components/admin/AdminSidebar.tsx` | Navegación lateral |
| `components/admin/AdminHeader.tsx` | Header con toggle de tema |
| `app/admin/layout.tsx` | Layout principal del admin |

### Páginas del admin

| Página | Archivo | Componentes clave |
|--------|---------|-------------------|
| Dashboard | `app/admin/page.tsx` | Stat cards, lista de empresas |
| Empresas | `app/admin/companies/` | Cards de empresa, filtros |
| Plantillas | `app/admin/templates/page.tsx` | Acordeón de módulos, badges |
| Módulos | `app/admin/modules/page.tsx` | Categorías, toggles |
| Usuarios | `app/admin/users/page.tsx` | Tabla, badges de rol/estado |
| Tickets | `app/admin/tickets/page.tsx` | Stat cards, tabla de tickets |

### Patrón de hidratación para tema

El toggle de tema requiere un patrón especial para evitar errores de hidratación (SSR mismatch):

```tsx
const [mounted, setMounted] = useState(false)
const { theme, setTheme } = useTheme()

useEffect(() => {
  setMounted(true)
}, [])

// Renderizar placeholder hasta que el cliente esté montado
{mounted ? (
  theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
) : (
  <div className="h-4 w-4" /> // Placeholder con mismo tamaño
)}
```

### Reglas de estilo para el admin

**NUNCA usar:**
- Colores hardcodeados (`text-gray-500`, `bg-blue-600`, etc.)
- Gradientes (`gradient-cta`, `bg-gradient-to-*`)
- Clases de color específicas para estados que no sean destructive

**SIEMPRE usar:**
- Variables semánticas del tema (`text-foreground`, `bg-card`, etc.)
- `bg-primary` para acentos (no gradientes)
- `text-primary` para texto destacado
- `border-border` para todos los bordes

---

## Git y commits

### Formato de commits (Conventional Commits)

```
tipo(alcance): descripción breve

[cuerpo opcional con más detalle]
```

**Tipos válidos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `refactor`: Cambio de código sin cambiar comportamiento
- `style`: Cambios de formato/estilo (no CSS)
- `docs`: Documentación
- `test`: Tests
- `chore`: Mantenimiento, dependencias, config
- `perf`: Mejoras de performance

**Ejemplos:**
```
feat(construccion): agregar gestión de plazos de obra
fix(auth): corregir redirección de viewer sin client_id
refactor(crm): extraer lógica de scoring a función independiente
perf(workspace): lazy load del módulo de finanzas
```

### Nombres de branches
```
feat/nombre-descriptivo      # Nueva funcionalidad
fix/descripcion-del-bug      # Corrección
refactor/area-afectada       # Refactoring
chore/tarea-de-mantenimiento # Mantenimiento
```

### Workflow de PRs
1. Crear branch desde `main`
2. Commits atómicos con Conventional Commits
3. PR con título descriptivo (<70 chars) y descripción con resumen + test plan
4. Review y merge a `main`

---

## Performance

### Server Components
- Preferir Server Components para páginas que solo muestran datos
- Fetch de datos en server, pasar como props a componentes client
- Referencia: `workspace-page-wrapper.tsx` usa `Promise.allSettled` para fetches paralelos

### Code splitting y lazy loading
- Los módulos del workspace se cargan por ruta (code splitting automático de Next.js)
- Usar `dynamic()` de Next.js para componentes pesados que no se necesitan en el render inicial
- Los charts (Recharts) y modals complejos son candidatos a lazy loading

### Imágenes
- Usar `next/image` con `width`, `height` y `alt` siempre
- Remote patterns configurados en `next.config.ts` para Unsplash y Supabase Storage

### Fetching de datos
- Server-side: usar Supabase directamente en Server Components
- Client-side: fetch a API routes propias, no directamente a Supabase
- Usar `Promise.allSettled` para fetches paralelos independientes
- Paginar resultados cuando se esperan listas grandes

### Bundle size
- Importar solo lo necesario de librerías (ej: iconos individuales de lucide-react)
- No importar librerías completas cuando solo se necesita una función
- Revisar que las dependencias pesadas (Recharts, LangChain) solo se carguen en las rutas que las usan

---

## Reglas críticas

### NUNCA hacer
- **NUNCA** ejecutar operaciones destructivas en la base de datos (DROP, DELETE FROM, TRUNCATE) — es producción con clientes activos (INTED)
- **NUNCA** modificar datos de la empresa INTED ni de ningún tenant activo durante desarrollo/testing
- **NUNCA** hardcodear `company_id` en el código (existe un caso legacy con MarketPaper que debe eliminarse)
- **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` o `ENCRYPTION_KEY` al client
- **NUNCA** importar `lib/auth-server` desde un componente `'use client'`
- **NUNCA** importar `lib/supabaseAdmin` desde el client
- **NUNCA** crear tablas sin RLS policies cuando contengan datos de empresa
- **NUNCA** confiar en `company_id` de query params para usuarios regulares (solo super_admin puede especificarlo)
- **NUNCA** almacenar credenciales de integración en texto plano
- **NUNCA** enviar credenciales descifradas en respuestas de API al frontend
- **NUNCA** saltear la validación de autenticación en API routes

### SIEMPRE hacer
- **SIEMPRE** validar autenticación y permisos en cada API route
- **SIEMPRE** filtrar por `company_id` en queries de datos multi-tenant
- **SIEMPRE** usar el patrón de 3 capas de RLS en tablas nuevas
- **SIEMPRE** regenerar tipos (`npm run gen:types`) después de cambios de schema
- **SIEMPRE** usar `'use client'` explícitamente en componentes interactivos
- **SIEMPRE** manejar errores con try/catch en API routes y devolver status codes apropiados
- **SIEMPRE** sanitizar nombres de archivo antes de subir a storage

---

## Módulos existentes

Referencia de los módulos activos para mantener consistencia al crear nuevos:

| Módulo | Ruta workspace | API base | Tabla principal |
|--------|---------------|----------|-----------------|
| Construcción | `/workspace/construccion` | `/api/workspace/construction/` | `projects` |
| CRM | `/workspace/crm` | `/api/workspace/crm/` | `unified_leads`, `contacts` |
| Finanzas | `/workspace/finanzas` | `/api/workspace/finanzas/` | `expenses` |
| Temas | `/workspace/temas` | `/api/workspace/temas/` | `temas` |
| Tareas | `/workspace/tareas` | `/api/workspace/tareas/` | `tema_tasks` |
| Cotizador | `/workspace/cotizador` | — | — |
| Ventas | `/workspace/ventas` | — | — |
| Soporte | `/workspace/soporte` | `/api/workspace/tickets/` | `support_tickets` |
| HubSpot | `/workspace/hubspot` | — (usa actions/) | `company_integrations` |

### Patrón para un módulo nuevo
```
app/(workspace)/workspace/nuevo-modulo/
├── page.tsx            # Página principal (Server Component wrapper)
├── client-page.tsx     # Contenido interactivo ('use client')
└── components/         # Componentes específicos del módulo

app/api/workspace/nuevo-modulo/
├── route.ts            # GET (listar), POST (crear)
└── [id]/
    └── route.ts        # GET (detalle), PUT (actualizar), DELETE (eliminar)
```

---

## Testing

- **Framework**: Vitest + @testing-library/react + jsdom
- **Config**: `vitest.config.ts` con alias `@/` configurado
- **Ubicación**: `lib/__tests__/` para tests unitarios o co-ubicados junto al archivo
- **Ejecutar**: `npm test` (watch) o `npm run test:run` (CI)

---

## Variables de entorno

Variables requeridas en `.env.local`:

```bash
# Supabase (obligatorias)
NEXT_PUBLIC_SUPABASE_URL=         # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Clave anónima (safe para client)
SUPABASE_SERVICE_ROLE_KEY=        # Clave de servicio (solo server)

# Seguridad (obligatoria)
ENCRYPTION_KEY=                   # Clave AES-256 para cifrado (64 hex chars)

# Notificaciones (opcional)
SLACK_WEBHOOK_URL=                # Webhook de Slack para alertas
```

Variables con prefijo `NEXT_PUBLIC_` son accesibles desde el browser. Las demás son solo server-side.
