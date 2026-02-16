# Nexus AI - Prompts

> [Inicio](../README.md) > [Nexus AI](vision-general.md) > Prompts

## Sistema de capas de prompts

Nexus usa un sistema de **3 capas** de prompts, cada una con versionado independiente:

| Capa | Propósito | Ejemplo |
|------|-----------|---------|
| `identity` | Quién es el agente | "Eres un asistente de ventas de FOMO..." |
| `instructions` | Qué debe hacer | "Cuando un cliente pregunte por precios..." |
| `safety` | Restricciones y límites | "Nunca compartir información de otras empresas..." |

## Estructura

```typescript
interface NexusPromptLayer {
  id: string
  projectId: string
  layerType: 'identity' | 'instructions' | 'safety'
  content: string
  version: number        // Auto-incremental por capa
  isActive: boolean      // Solo una versión activa por capa
  createdBy: string
  changeReason: string | null
  createdAt: string
}
```

## Versionado

- Cada cambio crea una **nueva versión** de la capa (nunca se sobrescribe)
- Solo una versión puede estar `isActive: true` por capa
- Se puede hacer rollback activando una versión anterior
- `changeReason` documenta por qué se cambió
- Las versiones se ordenan por número de versión descendente

## Editor

**Ruta:** `/admin/nexus/projects/[id]/prompts`
**Archivo:** `app/admin/nexus/projects/[projectId]/prompts/page.tsx` (~268 líneas)

### Interfaz

La página ofrece una interfaz de 3 tabs (Identity / Instructions / Safety) con:

- **Monaco Editor** (lazy-loaded, SSR-disabled) para edición de contenido
- Historial de versiones al lado con timestamps y razones de cambio
- Badge "Active" en la versión activa
- Detección de modificaciones: muestra "(modificado)" cuando hay cambios sin guardar
- Botón de guardar con campo opcional de razón de cambio
- Botón de revertir cambios

### Configuración de Monaco

```typescript
<MonacoEditor
  height="400px"
  language="markdown"
  theme="vs-dark"
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on',
    lineNumbers: 'off',
    padding: { top: 16 },
  }}
/>
```

### Flujo de trabajo

1. Seleccionar tab (identity / instructions / safety)
2. Se carga la versión activa de esa capa en el editor
3. Editar contenido → aparece badge "(modificado)"
4. Opcionalmente escribir razón del cambio
5. Guardar → crea nueva versión → se activa automáticamente
6. La versión anterior queda en el historial

### Historial de versiones

Cada versión en el historial muestra:
- Número de versión (ej: "v3")
- Fecha de creación
- Razón del cambio (si se proporcionó)
- Badge "Active" en la versión activa
- Click para cargar esa versión en el editor

## Composición del prompt final

El prompt final que recibe el agente se compone concatenando las 3 capas activas:

```
[identity activa]
---
[instructions activa]
---
[safety activa]
```

Los agentes pueden tener un resumen de estos prompts en su `config.promptSummary`:
```typescript
config: {
  promptSummary: {
    identity: "Resumen de la identidad del agente",
    instructions: "Resumen de las instrucciones",
    safety: "Resumen de las restricciones"
  }
}
```

## Configuración inicial

Al crear un proyecto con el [wizard de creación](proyectos.md), el paso 2 ("Identity") permite escribir el contenido inicial de cada capa. Estos se convierten en la versión 1 de cada capa al crear el proyecto.

**Templates predefinidos** que precargan contenido:

| Template | Identity | Instructions | Safety |
|----------|----------|-------------|--------|
| `sales` | Agente de ventas B2B | Manejo de leads, precios, seguimiento | Confidencialidad, límites de descuento |
| `support` | Agente de soporte | Resolución de tickets, escalamiento | No comprometer, derivar si es necesario |
| `internal` | Asistente interno con MCP | Operaciones internas, reportes | Acceso restringido a datos propios |
| `custom` | (vacío) | (vacío) | (vacío) |

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/projects/:id/prompt-layers` | Listar capas y versiones |
| POST | `/api/v1/projects/:id/prompt-layers` | Crear nueva versión |
| POST | `/api/v1/prompt-layers/:id/activate` | Activar una versión |

### Crear versión

```typescript
await nexusApi.createPromptLayer(projectId, {
  layerType: 'instructions',
  content: 'Nuevas instrucciones...',
  createdBy: 'admin-user-id',
  changeReason: 'Agregar manejo de preguntas de precios'
})
```

### Activar versión anterior (rollback)

```typescript
await nexusApi.activatePromptLayer(promptLayerId)
```

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `app/admin/nexus/projects/[projectId]/prompts/page.tsx` | Editor de prompts |
| `lib/nexus/types.ts` | Tipo `NexusPromptLayer` |
| `lib/nexus/api.ts` | Métodos `listPromptLayers`, `createPromptLayer`, `activatePromptLayer` |

## Ver también

- [Agentes](agentes.md) — `promptSummary` en config del agente
- [Proyectos](proyectos.md) — Prompts son por proyecto; wizard de creación
