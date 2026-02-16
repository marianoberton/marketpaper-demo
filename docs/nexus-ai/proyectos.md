# Nexus AI - Proyectos

> [Inicio](../README.md) > [Nexus AI](vision-general.md) > Proyectos

## Qué es un proyecto

Un proyecto es el contenedor principal de configuración en Nexus. Define qué modelo de IA usar, qué herramientas están permitidas, límites de presupuesto, y contiene los agentes.

## Estructura de un proyecto

```typescript
interface NexusProject {
  id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'archived'
  config: NexusProjectConfig
  createdAt: string
  updatedAt: string
}

interface NexusProjectConfig {
  provider: {
    provider: string      // 'anthropic', 'openai', etc.
    model: string         // 'claude-sonnet-4-5-20250929', etc.
    apiKeyEnvVar: string  // Variable de entorno con la API key
    temperature?: number  // 0-1
  }
  allowedTools: string[]           // Herramientas permitidas
  mcpServers?: NexusMcpServerConfig[]  // Servidores MCP
  memoryConfig?: Record<string, unknown>
  costConfig?: {
    dailyBudgetUSD: number     // Límite diario en USD
    monthlyBudgetUSD: number   // Límite mensual en USD
  }
  maxTurnsPerSession?: number      // Máximo de turnos por sesión
  maxConcurrentSessions?: number   // Sesiones simultáneas
}
```

## Estados de proyecto

| Estado | Descripción |
|--------|-------------|
| `active` | Operativo, agentes pueden ejecutar |
| `paused` | Pausado, agentes no pueden ejecutar |
| `archived` | Archivado, no visible en lista activa |

## Wizard de creación

La página `/admin/nexus/projects/new` guía al usuario en 5 pasos:

1. **Nombre y descripción**: Datos básicos del proyecto
2. **Provider y modelo**: Elegir proveedor de IA y modelo
3. **Herramientas**: Seleccionar tools permitidas
4. **Presupuesto**: Configurar límites de costo diario y mensual
5. **Revisión**: Confirmar y crear

## Templates predefinidos

| Template | Uso | Modelo sugerido |
|----------|-----|-----------------|
| Ventas | Asistente de ventas, seguimiento de leads | Claude Sonnet |
| Soporte | Responder tickets automáticamente | Claude Haiku |
| Interno | Análisis de datos, reportes | Claude Sonnet |

## MCP Servers

Los proyectos pueden configurar servidores MCP (Model Context Protocol):

```typescript
interface NexusMcpServerConfig {
  name: string
  transport: 'stdio' | 'sse'
  command?: string      // Para stdio
  args?: string[]       // Para stdio
  url?: string          // Para SSE
  env?: Record<string, string>
}
```

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/projects` | Listar proyectos |
| POST | `/api/v1/projects` | Crear proyecto |
| GET | `/api/v1/projects/:id` | Obtener proyecto |
| PATCH | `/api/v1/projects/:id` | Actualizar proyecto |

## Ver también

- [Agentes](agentes.md) - Agentes dentro de proyectos
- [Prompts](prompts.md) - Capas de prompts del proyecto
- [Costos y Uso](costos-y-uso.md) - Presupuesto y tracking
