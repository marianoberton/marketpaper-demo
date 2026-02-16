# Glosario

> [Inicio](../README.md) > Referencias > Glosario

## Términos del dominio

| Término | Definición |
|---------|-----------|
| **Tenant** | Empresa cliente que usa FOMO. Cada tenant tiene su workspace aislado |
| **Workspace** | Espacio de trabajo de una empresa. Contiene módulos, datos y configuración |
| **Viewer** | Cliente final de una empresa. Tiene acceso de solo lectura + tickets |
| **Tema** | Expediente, caso o proyecto dentro del módulo de Temas |
| **Lead** | Prospecto comercial capturado por cualquier canal |
| **Oportunidad** | Lead calificado que entró al pipeline de ventas |
| **Feature flag** | Funcionalidad habilitada/deshabilitada para una empresa (`features[]`) |
| **Portal de cliente** | Acceso web para viewers (clientes finales) |
| **Cotización** | Propuesta comercial/presupuesto generado en el cotizador |

## Términos técnicos

| Término | Definición |
|---------|-----------|
| **RLS** | Row Level Security. Políticas de PostgreSQL que filtran filas automáticamente |
| **Multi-tenancy** | Arquitectura donde múltiples empresas comparten la misma aplicación pero con datos aislados |
| **company_id** | UUID que identifica a una empresa. Columna clave para el aislamiento de datos |
| **Server Component** | Componente React que se ejecuta en el servidor (por defecto en Next.js 15) |
| **Client Component** | Componente React que se ejecuta en el browser (`'use client'`) |
| **API Route** | Endpoint REST implementado en Next.js (`app/api/`) |
| **Server Action** | Función del servidor invocable desde el client (alternativa a API routes) |
| **Middleware** | Código que intercepta requests antes de llegar a la página/API |
| **SSR** | Server-Side Rendering. Generar HTML en el servidor |
| **Supabase** | Plataforma BaaS (Backend as a Service) basada en PostgreSQL |
| **MCP** | Model Context Protocol. Protocolo para conectar herramientas a modelos de IA |
| **RAG** | Retrieval-Augmented Generation. Buscar documentos relevantes antes de generar respuesta |
| **AES-256-GCM** | Algoritmo de cifrado simétrico usado para credenciales de integración |

## Términos de Nexus AI

| Término | Definición |
|---------|-----------|
| **Nexus Core** | Backend independiente que ejecuta los agentes de IA |
| **Proyecto (Nexus)** | Contenedor de configuración: modelo, tools, presupuesto |
| **Agente** | Instancia de IA con rol y configuración específicos |
| **Sesión** | Conversación activa entre usuario y agente |
| **Prompt Layer** | Capa del prompt del agente (identity, instructions, safety) |
| **Approval** | Solicitud de aprobación humana para una acción del agente |
| **Scheduled Task** | Tarea programada con expresión cron |
| **Tool Call** | Invocación de una herramienta por parte del agente |
| **Execution Trace** | Registro detallado de una ejecución del agente |

## Siglas

| Sigla | Significado |
|-------|-----------|
| **B2B** | Business-to-Business |
| **SaaS** | Software as a Service |
| **CRUD** | Create, Read, Update, Delete |
| **RBAC** | Role-Based Access Control |
| **UUID** | Universally Unique Identifier |
| **JWT** | JSON Web Token (usado internamente por Supabase Auth) |
| **KPI** | Key Performance Indicator |
| **CRM** | Customer Relationship Management |
| **CSV** | Comma-Separated Values |

## Ver también

- [Roles y Permisos](roles-y-permisos.md) - Detalle de cada rol
- [Conceptos Clave](../introduccion/conceptos-clave.md) - Explicación de conceptos
