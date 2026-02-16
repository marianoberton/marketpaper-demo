# Estructura del Proyecto

> [Inicio](../README.md) > Guías > Estructura del Proyecto

## Árbol de carpetas principal

```
marketpaper-demo/
│
├── app/                          # Next.js App Router (rutas y páginas)
│   ├── (workspace)/workspace/    # Módulos del workspace (route group)
│   │   ├── construccion/         # Módulo de construcción
│   │   ├── crm/                  # CRM legacy (clientes B2B)
│   │   ├── crm-fomo/             # CRM avanzado multi-canal
│   │   ├── finanzas/             # Módulo financiero
│   │   ├── temas/                # Expedientes/temas
│   │   ├── tareas/               # Tareas del usuario
│   │   ├── cotizador/            # Generador de cotizaciones
│   │   ├── oportunidades/        # Pipeline de oportunidades
│   │   ├── hubspot/              # Analytics HubSpot
│   │   ├── soporte/              # Tickets de soporte
│   │   ├── Simulador/            # Simulador
│   │   ├── notifications/        # Centro de notificaciones
│   │   ├── settings/             # Configuración del workspace
│   │   └── layout.tsx            # Layout compartido (sidebar, header)
│   │
│   ├── admin/                    # Panel de super admin
│   │   ├── page.tsx              # Dashboard admin
│   │   ├── companies/            # Gestión de empresas
│   │   ├── users/                # Gestión de usuarios
│   │   ├── modules/              # Gestión de módulos
│   │   ├── templates/            # Plantillas de empresa
│   │   ├── tickets/              # Tickets globales
│   │   ├── analytics/            # Analytics de la plataforma
│   │   ├── api-keys/             # API keys
│   │   ├── nexus/                # Nexus AI (agentes autónomos)
│   │   ├── settings/             # Settings globales
│   │   └── layout.tsx            # Layout admin (sidebar, header)
│   │
│   ├── api/                      # API Routes (~70 endpoints)
│   │   ├── admin/                # APIs de administración
│   │   ├── auth/                 # APIs de autenticación
│   │   ├── workspace/            # APIs del workspace (multi-tenant)
│   │   │   ├── construction/     # Construcción
│   │   │   ├── crm/              # CRM
│   │   │   ├── crm-fomo/         # CRM avanzado
│   │   │   ├── finanzas/         # Finanzas
│   │   │   ├── temas/            # Temas
│   │   │   ├── tareas/           # Tareas
│   │   │   ├── tickets/          # Soporte
│   │   │   ├── oportunidades/    # Oportunidades
│   │   │   ├── notifications/    # Notificaciones
│   │   │   └── settings/         # Settings
│   │   ├── storage/              # Gestión de archivos
│   │   ├── webhook/              # Webhooks externos
│   │   ├── knowledge/            # RAG / knowledge base
│   │   ├── company/              # APIs de empresa
│   │   ├── user/                 # APIs de usuario
│   │   └── debug/                # APIs de debug
│   │
│   ├── client-view/              # Portal de cliente (viewer)
│   │   ├── page.tsx              # Dashboard del cliente
│   │   └── tickets/              # Tickets del cliente
│   │
│   ├── login/                    # Página de login
│   ├── client-login/             # Login de viewers
│   ├── register/                 # Registro de empresas
│   ├── forgot-password/          # Reset de password
│   ├── reset-password/           # Formulario de reset
│   ├── invite/accept/            # Aceptar invitación
│   ├── setup/                    # Setup inicial de perfil
│   ├── support/                  # Página pública de soporte
│   │
│   ├── layout.tsx                # Layout raíz (ThemeProvider, fonts, Toaster)
│   └── globals.css               # Variables CSS, tema claro/oscuro
│
├── components/                   # Componentes React reutilizables
│   ├── ui/                       # Componentes base (shadcn/ui) ~27 componentes
│   ├── admin/                    # Componentes del panel admin
│   ├── nexus/                    # Componentes de Nexus AI
│   ├── auth/                     # Componentes de autenticación
│   ├── client-view/              # Componentes del portal cliente
│   │
│   ├── workspace-layout.tsx      # Layout principal del workspace
│   ├── workspace-nav.tsx         # Navegación dinámica por módulos
│   ├── workspace-context.tsx     # Context de empresa/workspace
│   ├── workspace-theme-provider.tsx  # Tema del workspace
│   ├── layout-context.tsx        # Context de preferencias de UI
│   ├── Sidebar.tsx               # Sidebar principal
│   ├── Header.tsx                # Header de la app
│   ├── page-header.tsx           # Header de página
│   ├── notification-bell.tsx     # Campana de notificaciones
│   ├── theme-provider.tsx        # ThemeProvider (next-themes)
│   ├── empty-state.tsx           # Estado vacío reutilizable
│   └── UnifiedFileUpload.tsx     # Upload de archivos
│
├── lib/                          # Lógica de negocio y utilidades
│   ├── auth-client.ts            # Auth para componentes client
│   ├── auth-server.ts            # Auth para API routes / Server Components
│   ├── auth-types.ts             # Tipos y permisos compartidos
│   ├── encryption.ts             # Cifrado AES-256-GCM
│   ├── database.types.ts         # Tipos auto-generados de Supabase
│   ├── construction.ts           # Tipos del módulo construcción
│   ├── construction-deadlines.ts # Cálculo de plazos
│   ├── crm-multitenant.ts        # CRM multi-tenant
│   ├── hubspot.ts                # Integración HubSpot
│   ├── super-admin.ts            # Operaciones de super admin
│   ├── supabaseAdmin.ts          # Cliente admin (bypass RLS)
│   ├── utils.ts                  # Utilidades generales (cn(), etc.)
│   ├── formatters.ts             # Formateadores de datos
│   ├── storage.ts                # Helpers de storage
│   ├── slack-notifications.ts    # Webhooks de Slack
│   ├── nexus/                    # Cliente de Nexus AI
│   │   ├── api.ts                # API client REST
│   │   ├── types.ts              # Tipos TypeScript
│   │   └── websocket.ts          # Cliente WebSocket
│   ├── rag/                      # Sistema RAG
│   │   ├── knowledge-store.ts    # Vector store
│   │   └── knowledge-config.ts   # Configuración
│   ├── hubspot/                  # Submódulos HubSpot
│   │   ├── index.ts              # Exports principales
│   │   ├── ai-action-plan.ts     # Planes de acción con IA
│   │   └── price-analysis.ts     # Análisis de precios
│   ├── crm/                      # Submódulos CRM
│   │   └── channel-processors.ts # Procesadores por canal
│   └── __tests__/                # Tests unitarios
│
├── utils/supabase/               # Clientes Supabase
│   ├── client.ts                 # Cliente para el browser
│   ├── server.ts                 # Cliente para el server
│   └── middleware.ts             # Gestión de sesiones + routing
│
├── hooks/                        # Custom React hooks
│   └── useFileUpload.ts          # Hook de upload de archivos
│
├── actions/                      # Server Actions
│   ├── hubspot-analytics.ts      # Fetch de analytics HubSpot
│   ├── hubspot-price-analysis.ts # Análisis de precios
│   └── hubspot-test.ts           # Testing de integración
│
├── types/                        # Definiciones TypeScript adicionales
├── supabase/                     # Configuración Supabase
│   ├── config.toml               # Config local
│   └── migrations/               # Migraciones SQL (54+)
├── scripts/                      # Scripts utilitarios
├── public/                       # Assets estáticos
├── middleware.ts                  # Entry point del middleware
├── next.config.ts                # Config de Next.js
├── tailwind.config.ts            # Config de Tailwind
├── vitest.config.ts              # Config de Vitest
└── CLAUDE.md                     # Instrucciones para asistentes IA
```

## Convenciones de carpetas

### Módulos del workspace
Cada módulo sigue esta estructura:
```
app/(workspace)/workspace/modulo/
├── page.tsx            # Server Component (wrapper)
├── client-page.tsx     # Client Component (interactividad)
├── components/         # Componentes específicos del módulo
├── nuevo/              # Subpágina "crear nuevo" (si aplica)
│   ├── page.tsx
│   └── client-page.tsx
└── [id]/               # Subpágina de detalle (si aplica)
    ├── page.tsx
    └── client-page.tsx
```

### API routes
```
app/api/workspace/modulo/
├── route.ts            # GET (listar), POST (crear)
└── [id]/
    └── route.ts        # GET (detalle), PUT (actualizar), DELETE (eliminar)
```

### Componentes
- `components/ui/` → Solo componentes base de shadcn/ui
- `components/admin/` → Solo para el panel admin
- `components/nexus/` → Solo para Nexus AI
- `components/*.tsx` → Componentes compartidos del workspace

## Ver también

- [Patrones de Código](patrones-codigo.md) - Cómo escribir código
- [Crear un Módulo Nuevo](crear-modulo-nuevo.md) - Paso a paso
