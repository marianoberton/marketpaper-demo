# 🏢 FOMO CRM - Implementación Multi-Tenant

## 🎯 **Resumen del Sistema Multi-Tenant**

Hemos implementado una arquitectura multi-tenant completa que permite:

- **Aislamiento total de datos** por empresa
- **Gestión de usuarios y roles** granular
- **Cambio dinámico entre empresas** sin recargar
- **Seguridad a nivel de base de datos** con RLS
- **Escalabilidad** para múltiples clientes

## 📋 **Paso 1: Configurar Base de Datos Multi-Tenant**

### **1.1 Ejecutar Script SQL**
```sql
-- Ejecuta supabase-multitenant-setup.sql en Supabase SQL Editor
-- Este script crea:
-- ✅ Tabla companies (tenants)
-- ✅ Tabla user_profiles con company_id
-- ✅ Todas las tablas CRM actualizadas con company_id
-- ✅ RLS policies para aislamiento de datos
-- ✅ Índices optimizados para multi-tenant
-- ✅ Funciones auxiliares
```

### **1.2 Verificar Tablas Creadas**
```sql
-- Verificar que todas las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'user_profiles', 'leads', 'contacts', 'activities', 'pipeline', 'campaigns');
```

### **1.3 Verificar RLS Habilitado**
```sql
-- Verificar que RLS está activo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

## 🔧 **Paso 2: Configurar Variables de Entorno**

### **2.1 Actualizar .env.local**
```env
# Supabase (existente)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# NUEVO: Service Role Key para operaciones admin
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

### **2.2 Configurar Auth Hook en Supabase**
```sql
-- Crear función para auto-crear user_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Crear perfil de usuario automáticamente
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🏗️ **Paso 3: Implementar Frontend Multi-Tenant**

### **3.1 Estructura de Archivos Creada**
```
app/
├── providers/
│   └── CompanyProvider.tsx     ✅ Contexto multi-tenant
├── workspace/
│   └── layout.tsx              ✅ Layout con TenantSwitcher
components/
└── TenantSwitcher.tsx          ✅ Selector de empresas
lib/
├── supabase.ts                 ✅ Cliente actualizado
├── crm-multitenant.ts          ✅ Funciones CRM multi-tenant
middleware.ts                   ✅ Middleware de autenticación
```

### **3.2 Integrar en tu App**

#### **Actualizar Root Layout**
```tsx
// app/layout.tsx
import { CompanyProvider } from '@/app/providers/CompanyProvider'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CompanyProvider>
          {children}
        </CompanyProvider>
      </body>
    </html>
  )
}
```

#### **Usar Hooks Multi-Tenant**
```tsx
// En cualquier componente
import { useCompany, useCompanyId, usePermissions } from '@/app/providers/CompanyProvider'

function MyComponent() {
  const { currentCompany, userProfile, switchCompany } = useCompany()
  const companyId = useCompanyId()
  const { hasPermission, isAdmin, isOwner } = usePermissions()

  // Verificar permisos
  if (!hasPermission('read_leads')) {
    return <div>Sin permisos</div>
  }

  // Usar datos de la empresa actual
  return (
    <div>
      <h1>{currentCompany?.name}</h1>
      <p>Rol: {userProfile?.role}</p>
    </div>
  )
}
```

## 🔄 **Paso 4: Migrar Funciones CRM**

### **4.1 Actualizar Imports**
```tsx
// Cambiar de:
import { createLead, getLeads } from '@/lib/crm'

// A:
import { createLead, getLeads } from '@/lib/crm-multitenant'
```

### **4.2 Usar Funciones Multi-Tenant**
```tsx
// Las funciones ahora manejan company_id automáticamente
const leads = await getLeads({ status: 'new' })
const newLead = await createLead({
  name: 'Juan Pérez',
  email: 'juan@example.com',
  source: 'web-form'
  // company_id se agrega automáticamente
})
```

## 🌐 **Paso 5: Actualizar Webhooks**

### **5.1 Webhook de Formularios Web**
```javascript
// En tu web, agregar company_slug al formulario
FomoLeadCapture.init({
  webhookUrl: 'https://tu-dominio.com/api/webhook/leads',
  companySlug: 'tu-empresa-slug', // NUEVO
  trackingEnabled: true,
  autoCapture: true
});
```

### **5.2 Configurar Empresa por Defecto**
```sql
-- Crear empresa por defecto para webhooks sin company_slug
INSERT INTO companies (name, slug, plan, status) VALUES
('Default Company', 'default', 'starter', 'active');
```

## 👥 **Paso 6: Gestión de Usuarios y Empresas**

### **6.1 Crear Primera Empresa**
```tsx
// Función para crear empresa con owner
import { supabaseAdmin } from '@/lib/supabase'

async function createCompanyWithOwner(
  companyName: string,
  companySlug: string,
  ownerEmail: string,
  ownerName: string
) {
  // Crear empresa
  const { data: company } = await supabaseAdmin
    .from('companies')
    .insert([{
      name: companyName,
      slug: companySlug,
      plan: 'starter',
      status: 'active'
    }])
    .select()
    .single()

  // Actualizar usuario como owner
  const { data: user } = await supabaseAdmin.auth.admin.getUserByEmail(ownerEmail)
  
  if (user && company) {
    await supabaseAdmin
      .from('user_profiles')
      .update({
        company_id: company.id,
        role: 'owner',
        full_name: ownerName
      })
      .eq('id', user.id)
  }

  return company
}
```

### **6.2 Invitar Usuarios a Empresa**
```tsx
async function inviteUserToCompany(
  email: string,
  companyId: string,
  role: 'admin' | 'manager' | 'member' | 'viewer'
) {
  // Crear usuario en Auth
  const { data: user } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { invited: true }
  })

  // Crear perfil con empresa
  if (user) {
    await supabaseAdmin
      .from('user_profiles')
      .insert([{
        id: user.id,
        email,
        company_id: companyId,
        role,
        status: 'pending'
      }])
  }

  return user
}
```

## 🔐 **Paso 7: Configurar Autenticación**

### **7.1 Páginas de Auth Necesarias**
```
app/auth/
├── login/page.tsx              # Login
├── setup/page.tsx              # Setup inicial de usuario
├── select-company/page.tsx     # Selección de empresa
├── inactive/page.tsx           # Usuario inactivo
└── error/page.tsx              # Errores de auth
```

### **7.2 Flujo de Autenticación**
```mermaid
flowchart TD
    A[Usuario hace login] --> B{¿Tiene perfil?}
    B -->|No| C[/auth/setup]
    B -->|Sí| D{¿Está activo?}
    D -->|No| E[/auth/inactive]
    D -->|Sí| F{¿Tiene empresa?}
    F -->|No| G[/auth/select-company]
    F -->|Sí| H[/workspace/dashboard]
```

## 📊 **Paso 8: Testing Multi-Tenant**

### **8.1 Crear Datos de Prueba**
```sql
-- Crear empresas de prueba
INSERT INTO companies (name, slug, plan, status) VALUES
('Empresa A', 'empresa-a', 'professional', 'active'),
('Empresa B', 'empresa-b', 'starter', 'active');

-- Crear usuarios de prueba (después de registrarse)
-- UPDATE user_profiles SET company_id = 'empresa-a-id', role = 'owner' WHERE email = 'admin@empresa-a.com';
-- UPDATE user_profiles SET company_id = 'empresa-b-id', role = 'owner' WHERE email = 'admin@empresa-b.com';
```

### **8.2 Verificar Aislamiento**
```tsx
// Test: Usuario de Empresa A no debe ver datos de Empresa B
const leadsEmpresaA = await getLeads() // Solo leads de Empresa A
const contactsEmpresaA = await getContacts() // Solo contactos de Empresa A
```

### **8.3 Test de Cambio de Empresa**
```tsx
// Test: Cambiar entre empresas
const { switchCompany } = useCompany()
await switchCompany('empresa-b-id')
// Verificar que los datos cambian automáticamente
```

## 🚀 **Paso 9: Despliegue y Producción**

### **9.1 Variables de Entorno en Producción**
```env
# Producción
NEXT_PUBLIC_SUPABASE_URL=https://prod-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_role_key

# Configurar en Vercel/hosting
```

### **9.2 Configurar Dominios Personalizados (Opcional)**
```tsx
// Soporte para subdominios por empresa
// empresa-a.tudominio.com -> company_slug = 'empresa-a'
function getCompanyFromDomain(hostname: string): string | null {
  const subdomain = hostname.split('.')[0]
  return subdomain !== 'www' ? subdomain : null
}
```

## ✅ **Checklist de Implementación**

### **Backend**
- [ ] Script SQL ejecutado en Supabase
- [ ] RLS policies activas
- [ ] Auth hook configurado
- [ ] Service role key configurada

### **Frontend**
- [ ] CompanyProvider integrado
- [ ] TenantSwitcher funcionando
- [ ] Middleware configurado
- [ ] Funciones CRM actualizadas

### **Testing**
- [ ] Aislamiento de datos verificado
- [ ] Cambio de empresa funcional
- [ ] Webhooks con company_id
- [ ] Permisos por rol funcionando

### **Producción**
- [ ] Variables de entorno configuradas
- [ ] Empresas iniciales creadas
- [ ] Usuarios owner asignados
- [ ] Monitoreo configurado

## 🎉 **Resultado Final**

Al completar esta implementación tendrás:

✅ **Arquitectura Multi-Tenant Completa**  
✅ **Aislamiento Total de Datos por Empresa**  
✅ **Gestión de Usuarios y Roles Granular**  
✅ **Interfaz de Cambio de Empresa Fluida**  
✅ **Seguridad a Nivel de Base de Datos**  
✅ **Escalabilidad para Múltiples Clientes**  
✅ **CRM Funcional por Empresa**  
✅ **Webhooks Multi-Tenant**  

**¡Tu plataforma FOMO está lista para servir múltiples empresas de forma segura y escalable!** 🚀