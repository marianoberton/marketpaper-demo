# Variables de Entorno

> [Inicio](../README.md) > Referencias > Variables de Entorno

## Variables requeridas

| Variable | Acceso | Descripción |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Público | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Clave anónima de Supabase (respeta RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo server** | Clave de servicio (bypass RLS). Nunca exponer al client |
| `ENCRYPTION_KEY` | **Solo server** | Clave AES-256 para cifrado (64 caracteres hex). Generar con `openssl rand -hex 32` |

## Variables opcionales

| Variable | Acceso | Descripción |
|----------|--------|-------------|
| `NEXT_PUBLIC_NEXUS_API_URL` | Público | URL de Nexus Core. Default: `http://localhost:3002` |
| `SLACK_WEBHOOK_URL` | Solo server | Webhook de Slack para notificaciones |
| `OPENAI_API_KEY` | Solo server | API key de OpenAI (para RAG/knowledge base) |

## Reglas de acceso

- Variables con prefijo `NEXT_PUBLIC_` son accesibles desde el browser
- Variables sin prefijo son **solo server-side** por diseño de Next.js
- Nunca poner secrets en variables `NEXT_PUBLIC_`

## Archivo `.env.local`

```bash
# Supabase (obligatorias)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Server only (obligatorias)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ENCRYPTION_KEY=<64 hex chars>

# Nexus AI (opcional)
NEXT_PUBLIC_NEXUS_API_URL=http://localhost:3002

# Integraciones (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
OPENAI_API_KEY=sk-...
```

> **Nota**: `.env.local` está en `.gitignore` y no se commitea. Pedir los valores a un admin del equipo.

## Generar ENCRYPTION_KEY

```bash
openssl rand -hex 32
```

Produce 64 caracteres hexadecimales (32 bytes) necesarios para AES-256.

## Ver también

- [Primeros Pasos](../introduccion/primeros-pasos.md) - Setup del entorno
- [Seguridad](../arquitectura/seguridad.md) - Cifrado y secrets
