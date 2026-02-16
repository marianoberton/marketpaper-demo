# Arquitectura - Visión General

> [Inicio](../README.md) > Arquitectura > Visión General

## Capas de la aplicación

```mermaid
graph TB
    subgraph "Capa de Presentación"
        SC[Server Components<br/>Fetch + Render HTML]
        CC[Client Components<br/>'use client' - Interactividad]
    end

    subgraph "Capa de Lógica"
        MW[Middleware<br/>Auth + Routing]
        API[API Routes<br/>REST endpoints]
        SA[Server Actions<br/>HubSpot]
        LIB[lib/<br/>Lógica de negocio]
    end

    subgraph "Capa de Datos"
        SB[(Supabase<br/>PostgreSQL 17)]
        RLS[RLS Policies]
        STR[Storage<br/>Archivos]
    end

    subgraph "Servicios Externos"
        NX[Nexus Core<br/>Agentes IA]
        HS[HubSpot]
        OAI[OpenAI]
    end

    SC --> API
    CC --> API
    MW --> SC
    MW --> CC
    API --> LIB
    LIB --> SB
    SB --> RLS
    API --> STR
    SA --> HS
    LIB --> OAI
    API --> NX
```

## Flujo de una request típica

```mermaid
sequenceDiagram
    participant B as Browser
    participant MW as Middleware
    participant P as Page (Server Component)
    participant API as API Route
    participant DB as Supabase (PostgreSQL)

    B->>MW: GET /workspace/construccion
    MW->>MW: Verificar sesión (cookie)
    MW->>DB: auth.getUser()
    DB-->>MW: User + Session
    MW-->>B: Allow (o redirect a /login)

    B->>P: Render página
    P->>API: fetch datos
    API->>API: getCurrentUser() - verificar auth
    API->>API: Obtener company_id del perfil
    API->>DB: SELECT * FROM projects WHERE company_id = ?
    DB-->>API: Datos filtrados por RLS
    API-->>P: JSON response
    P-->>B: HTML renderizado
```

## Rutas principales de la aplicación

| Ruta | Propósito | Acceso |
|------|-----------|--------|
| `/login` | Login de usuarios | Público |
| `/client-login` | Login de viewers | Público |
| `/register` | Registro de empresas | Público |
| `/setup` | Setup inicial de perfil | Autenticado sin perfil |
| `/workspace/*` | Módulos del workspace | Usuarios con company_id |
| `/admin/*` | Panel de super admin | Solo super_admin |
| `/client-view/*` | Portal de cliente | Solo viewer con client_id |
| `/api/*` | API REST | Depende del endpoint |

## Archivos clave de infraestructura

| Archivo | Propósito |
|---------|-----------|
| `middleware.ts` | Entry point del middleware (delega a `utils/supabase/middleware.ts`) |
| `utils/supabase/middleware.ts` | Lógica de auth, refresh de sesión, routing por rol |
| `utils/supabase/client.ts` | Cliente Supabase para el browser |
| `utils/supabase/server.ts` | Cliente Supabase para el servidor (cookies) |
| `lib/supabaseAdmin.ts` | Cliente admin (bypass RLS, solo server) |
| `app/layout.tsx` | Layout raíz (ThemeProvider, fonts, Toaster) |
| `app/(workspace)/workspace/layout.tsx` | Layout del workspace (sidebar, header, context) |
| `app/admin/layout.tsx` | Layout del admin panel |

## Patrones arquitectónicos

### Page Wrapper Pattern
Las páginas usan el patrón de Server Component wrapper + Client Component:

```
page.tsx          → Server Component: fetch de datos
client-page.tsx   → Client Component: UI interactiva
```

El server component obtiene los datos y los pasa como props al client component. Esto permite:
- Fetch de datos en el servidor (más rápido, seguro)
- Interactividad en el cliente (useState, onClick, etc.)

### API Route Pattern
Toda API route sigue un patrón estándar:
1. Autenticar usuario
2. Obtener company_id del perfil
3. Filtrar queries por company_id
4. Retornar datos o error

Ver [Patrones de Código](../guias/patrones-codigo.md) para ejemplos.

## Ver también

- [Multi-tenancy](multi-tenancy.md) - Aislamiento de datos
- [Autenticación](autenticacion.md) - Sistema de auth
- [Patrones de Código](../guias/patrones-codigo.md) - Convenciones de código
