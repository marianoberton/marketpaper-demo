# Contexto Técnico
## FOMO Platform - Stack Optimizado y Configuración de Producción

### Stack Tecnológico Actual (Optimizado)

#### **Frontend Core**
- **Next.js 15.3.1 (Turbopack)**: App Router, Server Components, configuración optimizada
- **TypeScript**: Strict mode, arquitectura cliente/servidor separada
- **Tailwind CSS**: Utility-first con tokens FOMO personalizados
- **React 18**: Concurrent features, Suspense, optimizado para performance

#### **UI/UX Libraries**
- **Shadcn/ui**: Base component library
- **Lucide React**: Icon system
- **Recharts**: Data visualization para analytics
- **Class Variance Authority**: Component variants
- **Tailwind Merge**: Dynamic class composition optimizado

#### **Autenticación y Backend**
- **Supabase**: Database, Authentication, RLS, Storage
- **PostgreSQL**: Base de datos principal con Row Level Security
- **Custom Auth Layer**: Separación cliente/servidor para Next.js 15+

### Configuración Optimizada Actual

#### **Next.js Configuration (Actualizada)**
```typescript
// next.config.ts - Optimizada para Next.js 15+
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': ['@svgr/webpack']
      }
    }
  },
  images: {
    domains: ['localhost', 'fomo-platform.com']
  }
  // Configuraciones deprecadas removidas:
  // - appDir (innecesario en Next.js 15)
  // - buildActivity (deprecado)
  // - onDemandEntries (deprecado)
};

export default nextConfig;
```

#### **Arquitectura de Autenticación Optimizada**
```typescript
// lib/auth-types.ts - Tipos compartidos y constantes
export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'company_owner' | 'company_member';
  company_id?: string;
}

// lib/auth-client.ts - Para componentes cliente
export const getUser = async (): Promise<User | null> => {
  // Usa supabase browser client
  const supabase = createClientComponentClient();
  // ... implementación cliente
};

// lib/auth-server.ts - Para API routes y Server Components
export const getUser = async (): Promise<User | null> => {
  // Usa supabase server client con cookies()
  const supabase = createServerComponentClient({ cookies });
  // ... implementación servidor
};
```

#### **Sistema de Branding FOMO**
```typescript
// Tokens de diseño FOMO implementados
const fomoDesignSystem = {
  colors: {
    signal: '#FCCD12',      // Amarillo FOMO
    brilliant: '#0077B6',   // Azul FOMO
    orange: '#f97316',      // Naranja corporativo
    plum: '#310629'         // Morado oscuro
  },
  logos: {
    main: '/Logo-fomo.svg',
    sizes: {
      header: '96x96px',      // Optimizado
      sidebar: '80x80px',     // Optimizado  
      collapsed: '56x56px',   // Optimizado
      mobile: '56x56px'       // Añadido
    }
  },
  fonts: {
    logo: ['Concert One', 'cursive'],
    heading: ['Space Grotesk', 'sans-serif'],
    body: ['Manrope', 'sans-serif']
  }
};
```

### Dependencias de Producción Actuales

#### **Core Dependencies**
```json
{
  "next": "^15.3.1",
  "react": "^18.0.0", 
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/ssr": "^0.1.0"
}
```

#### **UI/UX Dependencies**
```json
{
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tabs": "^1.0.4",
  "lucide-react": "^0.300.0",
  "recharts": "^2.8.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

#### **Development Dependencies**
```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^15.3.1",
  "postcss": "^8.0.0",
  "autoprefixer": "^10.0.0"
}
```

### Estructura de Proyecto Optimizada

```
fomo-platform/
├── app/                          # Next.js App Router
│   ├── (workspace)/              # Workspace routes con layout
│   │   └── workspace/
│   │       ├── construccion/     # Módulo completamente funcional
│   │       ├── crm/              # Módulos preparados
│   │       └── page.tsx          # Dashboard principal
│   ├── admin/                    # Panel administrativo
│   ├── api/                      # API routes
│   │   ├── auth/                 # Autenticación
│   │   ├── admin/                # Admin endpoints
│   │   └── workspace/            # Workspace APIs
│   ├── login/                    # Login con branding FOMO
│   ├── register/                 # Registro empresarial
│   ├── page.tsx                  # Landing FOMO optimizada
│   └── globals.css               # Estilos globales
├── lib/                          # Librerías y utilidades
│   ├── auth-client.ts            # NUEVO: Auth para cliente
│   ├── auth-server.ts            # NUEVO: Auth para servidor  
│   ├── auth-types.ts             # NUEVO: Tipos compartidos
│   ├── construction.ts           # Módulo construcción
│   ├── supabase.ts               # Clientes Supabase
│   └── utils.ts                  # Utilidades generales
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── admin/                    # Componentes admin
│   ├── Header.tsx                # Header con logos optimizados
│   ├── Sidebar.tsx               # Sidebar con branding FOMO
│   └── workspace-layout.tsx      # Layout workspace
├── memory-bank/                  # Documentación del proyecto
├── public/                       # Assets estáticos
│   └── Logo-fomo.svg             # Logo oficial FOMO
└── supabase/                     # Configuración base de datos
    └── migrations/               # Migraciones aplicadas
```

### Optimizaciones Técnicas Implementadas

#### **Resolución de Errores Next.js 15**
```typescript
// ANTES: Error en componentes cliente
import { cookies } from 'next/headers'; // ❌ Error en cliente

// DESPUÉS: Separación limpia
// En componentes cliente
import { getUser } from '@/lib/auth-client';

// En API routes y Server Components  
import { getUser } from '@/lib/auth-server';
```

#### **Configuración Sin Warnings**
```typescript
// Removidas configuraciones deprecadas:
// ❌ appDir: true          (innecesario en Next.js 15)
// ❌ buildActivity: false  (deprecado)
// ❌ onDemandEntries      (deprecado)

// ✅ Configuración limpia y moderna
const nextConfig: NextConfig = {
  experimental: {
    turbo: { rules: { '*.svg': ['@svgr/webpack'] } }
  }
};
```

#### **Performance y Caching**
- **Turbopack**: Bundler por defecto más rápido
- **Server Components**: Maximizar rendering del servidor
- **Dynamic Imports**: Carga lazy de módulos pesados
- **Image Optimization**: Next.js Image component optimizado

### Base de Datos y Backend

#### **Supabase Configuration**
```sql
-- Estructura multi-tenant implementada
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'company_owner', 'company_member')),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS habilitado para aislamiento de datos
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

#### **API Architecture**
```typescript
// Estructura de APIs organizada
app/api/
├── auth/                    # Autenticación
│   ├── users/route.ts      # Gestión usuarios
│   └── company/route.ts    # Info empresa
├── admin/                  # Endpoints admin
│   ├── companies/route.ts  # CRUD empresas
│   └── users/route.ts      # Gestión usuarios
└── workspace/              # APIs workspace
    └── construction/       # Módulo construcción
        ├── projects/route.ts
        ├── clients/route.ts
        └── documents/route.ts
```

### Seguridad y Autenticación

#### **Multi-tenant Security**
- **Row Level Security**: Aislamiento automático por empresa
- **JWT con claims**: Validación granular de permisos
- **Server-side validation**: Verificación en cada API call
- **Type-safe authentication**: TypeScript estricto en auth

#### **Error Handling**
```typescript
// Manejo consistente de errores
export async function handleApiError(error: unknown) {
  console.error('API Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Desarrollo y Deployment

#### **Environment Variables**
```bash
# .env.local (Producción)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_secret
```

#### **Scripts de Desarrollo**
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### Estado Técnico Actual

#### **Estabilidad** ✅
- **Sin errores**: Aplicación funciona sin errores en consola
- **Configuración limpia**: Sin warnings de deprecación
- **Performance optimizada**: Turbopack + configuración moderna
- **Type safety**: TypeScript estricto en toda la aplicación

#### **Escalabilidad** ✅ 
- **Multi-tenant**: Arquitectura empresarial robusta
- **Modular**: Fácil agregar nuevos módulos
- **API-first**: Backend preparado para integraciones
- **Component system**: UI reutilizable y consistente

#### **Mantenibilidad** ✅
- **Código limpio**: Separación de responsabilidades clara
- **Documentación**: Memory bank actualizado
- **Testing ready**: Estructura preparada para tests
- **Monitoring**: Logs y error tracking implementados

**Estado Técnico**: Sistema robusto, optimizado y listo para producción con configuración moderna de Next.js 15+ y arquitectura escalable multi-tenant. 