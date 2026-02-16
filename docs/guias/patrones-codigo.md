# Patrones de Código

> [Inicio](../README.md) > Guías > Patrones de Código

## Server Components vs Client Components

### Server Components (por defecto)
- Se ejecutan en el servidor
- Pueden hacer fetch de datos directamente
- No pueden usar hooks (useState, useEffect) ni eventos (onClick)
- Más rápidos: no envían JavaScript al browser

### Client Components (`'use client'`)
- Se ejecutan en el browser
- Necesarios para interactividad (hooks, eventos, estado)
- Deben declarar `'use client'` al inicio del archivo

### Patrón page.tsx + client-page.tsx

```typescript
// page.tsx (Server Component - wrapper)
import { ClientPage } from './client-page'

export default async function Page() {
  // Fetch de datos en el servidor
  const data = await fetchSomeData()
  return <ClientPage initialData={data} />
}

// client-page.tsx (Client Component - interactividad)
'use client'

export function ClientPage({ initialData }) {
  const [data, setData] = useState(initialData)
  // ... lógica interactiva
}
```

**Referencia real**: `app/(workspace)/workspace/layout.tsx` usa `Promise.allSettled` para fetches paralelos y pasa los datos al `WorkspaceProvider`.

## API Routes

### Patrón estándar

Toda API route debe:
1. Autenticar al usuario
2. Obtener `company_id` del perfil
3. Filtrar queries por `company_id`
4. Retornar errores apropiados

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Autenticar
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener company_id del perfil
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 })
    }

    // Super admin puede acceder a cualquier empresa
    const searchParams = request.nextUrl.searchParams
    const companyId = profile.role === 'super_admin'
      ? searchParams.get('company_id') || profile.company_id
      : profile.company_id

    // 3. Query filtrada por company_id
    const { data, error } = await supabase
      .from('tabla')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
```

### POST con validación

```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    const body = await request.json()

    // Validar datos requeridos
    if (!body.name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tabla')
      .insert({
        ...body,
        company_id: profile.company_id,  // Siempre asignar company_id
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

## Imports de autenticación

```typescript
// ✅ En componentes 'use client'
import { getCurrentUserClient } from '@/lib/auth-client'

// ✅ En API routes y Server Components
import { getCurrentUser } from '@/lib/auth-server'

// ✅ En cualquier lugar (solo tipos y helpers puros)
import { hasPermission, ROLE_PERMISSIONS, type UserRole } from '@/lib/auth-types'

// ❌ NUNCA en componentes client
import { getCurrentUser } from '@/lib/auth-server'
```

## Fetching de datos

### Server-side (recomendado)
Usar Supabase directamente en Server Components:
```typescript
const supabase = await createClient()
const { data } = await supabase.from('projects').select('*')
```

### Client-side
Fetch a API routes propias, no directamente a Supabase:
```typescript
const res = await fetch('/api/workspace/construction/projects')
const data = await res.json()
```

### Fetches paralelos
Usar `Promise.allSettled` para fetches independientes:
```typescript
const [projectsResult, clientsResult] = await Promise.allSettled([
  supabase.from('projects').select('*').eq('company_id', companyId),
  supabase.from('clients').select('*').eq('company_id', companyId),
])

const projects = projectsResult.status === 'fulfilled' ? projectsResult.value.data : []
const clients = clientsResult.status === 'fulfilled' ? clientsResult.value.data : []
```

## UI y componentes

### Componentes shadcn/ui
```bash
# Agregar un componente nuevo
npx shadcn@latest add [componente]
```

Los componentes se instalan en `components/ui/` y se pueden personalizar directamente.

### Combinar clases CSS
Siempre usar `cn()` de `lib/utils.ts`:
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "danger" && "text-destructive"
)} />
```

### Notificaciones
Usar `toast` de `sonner`:
```typescript
import { toast } from 'sonner'

toast.success('Operación exitosa')
toast.error('Algo salió mal')
toast.info('Información')
```

### Iconos
Solo lucide-react, importar individualmente:
```typescript
import { Building2, Users, Settings } from 'lucide-react'
```

## Colores y temas

Usar **siempre** variables semánticas del tema, nunca colores hardcodeados:

```typescript
// ✅ Correcto
<div className="bg-card text-foreground border-border">
<span className="text-muted-foreground">
<Badge className="bg-primary/10 text-primary">

// ❌ Incorrecto
<div className="bg-gray-800 text-white border-gray-600">
<span className="text-gray-500">
```

## Git

### Formato de commits (Conventional Commits)
```
tipo(alcance): descripción breve
```

Tipos: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `perf`

```bash
feat(construccion): agregar gestión de plazos de obra
fix(auth): corregir redirección de viewer sin client_id
refactor(crm): extraer lógica de scoring a función independiente
```

## Ver también

- [Estructura del Proyecto](estructura-proyecto.md) - Dónde va cada archivo
- [Crear un Módulo Nuevo](crear-modulo-nuevo.md) - Aplicar estos patrones
- [Trabajar con Base de Datos](trabajar-con-base-datos.md) - Queries y migraciones
