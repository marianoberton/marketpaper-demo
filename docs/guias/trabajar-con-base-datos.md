# Trabajar con Base de Datos

> [Inicio](../README.md) > Guías > Trabajar con Base de Datos

## Base de datos de producción

> **ALERTA CRÍTICA**: La base de datos conectada es de **producción**. No existe staging. Los datos de clientes activos (como INTED) son reales y están siendo usados en este momento.

### Reglas inquebrantables

1. **Solo migraciones aditivas**: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX`
2. **Nunca ejecutar**: `DROP TABLE`, `DELETE FROM`, `TRUNCATE`, `ALTER TABLE DROP COLUMN`
3. **Antes de cualquier migración**: verificar que no afecte datos existentes
4. **Para modificar estructura existente**: siempre preguntar antes al equipo
5. **Para probar**: usar una empresa de test, nunca datos de INTED

## Crear una migración

### 1. Determinar el número secuencial

Buscar la última migración en `supabase/migrations/` y usar el siguiente número:

```
supabase/migrations/
├── 0001_initial.sql
├── 0002_create_projects.sql
├── ...
├── 0054_add_client_portal_to_companies.sql
└── 0055_mi_nueva_migracion.sql  ← siguiente
```

### 2. Escribir la migración

```sql
-- supabase/migrations/0055_descripcion.sql

-- Tabla nueva
CREATE TABLE IF NOT EXISTS mi_tabla (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  -- campos...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS obligatorio
ALTER TABLE mi_tabla ENABLE ROW LEVEL SECURITY;

-- Policies (patrón de 3 capas)
CREATE POLICY "Super admins full access" ON mi_tabla
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Company admins manage" ON mi_tabla
  FOR ALL
  USING (company_id = get_user_company_id() AND is_company_admin())
  WITH CHECK (company_id = get_user_company_id() AND is_company_admin());

CREATE POLICY "Users read own company" ON mi_tabla
  FOR SELECT
  USING (is_super_admin() OR (auth.uid() IS NOT NULL AND company_id = get_user_company_id()));

-- Índice
CREATE INDEX idx_mi_tabla_company_id ON mi_tabla(company_id);
```

### 3. Agregar columna a tabla existente

```sql
-- Siempre con IF NOT EXISTS
ALTER TABLE projects ADD COLUMN IF NOT EXISTS nueva_columna TEXT;
```

### 4. Aplicar la migración

Las migraciones se aplican manualmente en el dashboard de Supabase (SQL Editor) o via Supabase CLI.

## Regenerar tipos TypeScript

Después de cualquier cambio en el schema:

```bash
npm run gen:types
```

Esto actualiza `lib/database.types.ts`. Verificar que los tipos nuevos aparezcan correctamente.

## Queries con Supabase client

### Select básico
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('company_id', companyId)
  .order('created_at', { ascending: false })
```

### Select con relaciones
```typescript
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    clients(id, name),
    project_documents(id, name, file_url)
  `)
  .eq('company_id', companyId)
```

### Insert
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    company_id: companyId,
    name: 'Nuevo proyecto',
    status: 'active',
  })
  .select()
  .single()
```

### Update
```typescript
const { data, error } = await supabase
  .from('projects')
  .update({
    name: 'Nombre actualizado',
    updated_at: new Date().toISOString(),
  })
  .eq('id', projectId)
  .eq('company_id', companyId)  // Siempre filtrar por company_id
  .select()
  .single()
```

### Delete
```typescript
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)
  .eq('company_id', companyId)
```

### Upsert
```typescript
const { data, error } = await supabase
  .from('settings')
  .upsert({
    company_id: companyId,
    key: 'theme',
    value: 'dark',
  })
  .select()
  .single()
```

## Funciones SQL helper disponibles

Usables en RLS policies y queries directas:

| Función | Retorna | Uso |
|---------|---------|-----|
| `is_super_admin()` | boolean | Verificar super admin |
| `is_company_admin()` | boolean | Verificar admin de empresa |
| `get_user_company_id()` | UUID | Obtener company_id del usuario |
| `get_user_role()` | text | Obtener rol del usuario |
| `auth.uid()` | UUID | ID del usuario autenticado |

## Cliente admin (bypass RLS)

Para operaciones que necesitan saltar RLS (ej: crear usuario, operaciones cross-tenant):

```typescript
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ⚠️ SOLO usar en server-side, nunca en client
const { data } = await supabaseAdmin
  .from('user_profiles')
  .select('*')
  // Sin filtro de company_id - accede a todo
```

> **NUNCA** importar `supabaseAdmin` desde componentes client.

## Errores comunes

### Error PGRST116 (no rows)
`.single()` falla si no encuentra exactamente 1 fila. Usar `.maybeSingle()` si el registro puede no existir:

```typescript
const { data } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('id', userId)
  .maybeSingle()  // Retorna null si no existe, en vez de error
```

### Error de RLS (permission denied)
Si una query falla silenciosamente (retorna array vacío cuando debería tener datos), verificar:
1. ¿La tabla tiene RLS habilitado? (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
2. ¿Existen policies para la operación? (SELECT, INSERT, UPDATE, DELETE)
3. ¿El usuario tiene el rol correcto?
4. ¿El `company_id` es correcto?

## Ver también

- [Multi-tenancy](../arquitectura/multi-tenancy.md) - RLS de 3 capas
- [Base de Datos](../arquitectura/base-de-datos.md) - Schema y tablas
- [Crear un Módulo Nuevo](crear-modulo-nuevo.md) - Incluye migración completa
