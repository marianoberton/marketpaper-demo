# Crear un Módulo Nuevo

> [Inicio](../README.md) > Guías > Crear un Módulo Nuevo

Guía paso a paso para agregar un módulo nuevo al workspace de FOMO.

## Paso 1: Crear las rutas del frontend

Crear la estructura de carpetas en `app/(workspace)/workspace/`:

```
app/(workspace)/workspace/mi-modulo/
├── page.tsx            # Server Component (wrapper)
├── client-page.tsx     # Client Component (interactividad)
├── components/         # Componentes específicos (opcional)
├── nuevo/              # Subpágina "crear" (opcional)
│   ├── page.tsx
│   └── client-page.tsx
└── [id]/               # Subpágina de detalle (opcional)
    ├── page.tsx
    └── client-page.tsx
```

### page.tsx (Server Component)

```typescript
import { MiModuloClientPage } from './client-page'

export default function MiModuloPage() {
  return <MiModuloClientPage />
}
```

### client-page.tsx (Client Component)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/components/workspace-context'
import { PageHeader } from '@/components/page-header'
import { toast } from 'sonner'

export function MiModuloClientPage() {
  const { companyId } = useWorkspace()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return

    async function fetchData() {
      try {
        const res = await fetch(`/api/workspace/mi-modulo?company_id=${companyId}`)
        if (!res.ok) throw new Error('Error al cargar datos')
        const result = await res.json()
        setData(result)
      } catch (error) {
        toast.error('Error al cargar datos')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [companyId])

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Módulo" description="Descripción del módulo" />
      {/* ... contenido */}
    </div>
  )
}
```

## Paso 2: Crear las API routes

Crear en `app/api/workspace/mi-modulo/`:

### route.ts (listar + crear)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    const searchParams = request.nextUrl.searchParams
    const companyId = profile.role === 'super_admin'
      ? searchParams.get('company_id') || profile.company_id
      : profile.company_id

    const { data, error } = await supabase
      .from('mi_tabla')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    const body = await request.json()

    const { data, error } = await supabase
      .from('mi_tabla')
      .insert({
        ...body,
        company_id: profile.company_id,
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

### [id]/route.ts (detalle + actualizar + eliminar)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Similar al GET de arriba pero con .eq('id', params.id).single()
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Update con .eq('id', params.id).eq('company_id', companyId)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Delete con .eq('id', params.id).eq('company_id', companyId)
}
```

## Paso 3: Crear la migración SQL

Crear archivo en `supabase/migrations/` con el siguiente número secuencial:

```sql
-- supabase/migrations/0055_create_mi_tabla.sql

-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS mi_tabla (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE mi_tabla ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (patrón de 3 capas)
CREATE POLICY "Super admins full access" ON mi_tabla
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Company admins manage" ON mi_tabla
  FOR ALL
  USING (company_id = get_user_company_id() AND is_company_admin())
  WITH CHECK (company_id = get_user_company_id() AND is_company_admin());

CREATE POLICY "Users read own company" ON mi_tabla
  FOR SELECT
  USING (
    is_super_admin()
    OR (auth.uid() IS NOT NULL AND company_id = get_user_company_id())
  );

-- 4. Índice en company_id
CREATE INDEX idx_mi_tabla_company_id ON mi_tabla(company_id);
```

> **ALERTA**: La base de datos es de producción. Usar solo migraciones aditivas (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). Nunca `DROP` ni `DELETE FROM`.

## Paso 4: Regenerar tipos TypeScript

```bash
npm run gen:types
```

Esto actualiza `lib/database.types.ts` con los tipos de la nueva tabla.

## Paso 5: Agregar al sistema de módulos

Opción A: Desde el admin panel (`/admin/modules`) crear el módulo con:
- `name`: Nombre visible
- `slug`: identificador (ej: `mi-modulo`)
- `route_path`: `/workspace/mi-modulo`
- `icon`: Nombre de ícono de lucide-react
- `category`: Dashboard, CRM, Workspace, Tools, o Admin
- `display_order`: Número para ordenar
- `allowed_roles`: Roles que pueden verlo (vacío = todos)

Opción B: Via migración SQL:
```sql
INSERT INTO modules (name, slug, route_path, icon, category, display_order, is_active)
VALUES ('Mi Módulo', 'mi-modulo', '/workspace/mi-modulo', 'Package', 'Workspace', 50, true);
```

## Paso 6: Agregar ícono (si es nuevo)

Si el ícono elegido no está en el mapa de `workspace-nav.tsx`, agregarlo:

```typescript
// components/workspace-nav.tsx
import { ..., MiIcono } from "lucide-react"

const ICONS = { ..., MiIcono }
```

## Checklist final

- [ ] Rutas del frontend creadas (`page.tsx` + `client-page.tsx`)
- [ ] API routes creadas (GET, POST, PUT, DELETE)
- [ ] Migración SQL con tabla + RLS + índice
- [ ] Tipos regenerados (`npm run gen:types`)
- [ ] Módulo registrado en el sistema (admin panel o migración)
- [ ] Ícono agregado al mapa si es nuevo
- [ ] Auth verificada en todas las API routes
- [ ] Filtrado por `company_id` en todas las queries
- [ ] Funciona el módulo en el sidebar
- [ ] Funciona la creación/lectura/actualización/eliminación
- [ ] Ficha de documentación creada en `docs/modulos/workspace/mi-modulo.md`

## Ver también

- [Patrones de Código](patrones-codigo.md) - Convenciones de código
- [Trabajar con Base de Datos](trabajar-con-base-datos.md) - Migraciones y tipos
- [Multi-tenancy](../arquitectura/multi-tenancy.md) - RLS de 3 capas
- [Sistema Modular](../arquitectura/sistema-modular.md) - Cómo funcionan los módulos
