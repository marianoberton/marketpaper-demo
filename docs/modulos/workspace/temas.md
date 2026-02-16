# Módulo de Temas

> [Inicio](../../README.md) > [Módulos](../README.md) > Temas

## Descripción

Módulo de gestión de expedientes, temas o casos. Cada tema puede tener tareas, comentarios, adjuntos, asignados y un log de actividad. Es un sistema flexible adaptable a diferentes industrias (legal, construcción, consultoría, etc.).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/temas` | Lista de temas con filtros |
| `/workspace/temas/nuevo` | Crear tema nuevo |
| `/workspace/temas/[id]` | Detalle del tema (tareas, comentarios, adjuntos) |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/temas` | Listar/crear temas |
| GET/PUT/DELETE | `/api/workspace/temas/[id]` | CRUD de tema |
| GET/POST | `/api/workspace/temas/[id]/tasks` | Tareas del tema |
| PUT/DELETE | `/api/workspace/temas/[id]/tasks/[taskId]` | CRUD de tarea |
| GET/POST | `/api/workspace/temas/[id]/comments` | Comentarios |
| GET/POST | `/api/workspace/temas/areas` | Áreas de práctica |
| GET/POST | `/api/workspace/temas/types` | Tipos de tema |
| GET | `/api/workspace/temas/clients` | Clientes asociables |

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `temas` | Temas/expedientes principales |
| `tema_types` | Tipos de tema (configurables por empresa) |
| `tema_areas` | Áreas de práctica |
| `tema_tasks` | Tareas dentro de temas |
| `tema_task_templates` | Templates reutilizables de tareas |
| `tema_assignees` | Asignaciones de equipo |
| `tema_comments` | Comentarios/notas |
| `tema_attachments` | Archivos adjuntos |
| `tema_activity` | Log de actividad |

## Funcionalidades

- Crear temas con tipo, área, cliente asociado, y estado
- Agregar tareas con asignados, prioridad y fecha límite
- Comentarios/notas en cada tema
- Adjuntar archivos
- Templates de tareas reutilizables
- Log de actividad automático
- Filtros por tipo, área, estado y cliente

## Relación con Tareas

Los registros de `tema_tasks` son los mismos que se ven en el módulo de [Tareas](tareas.md), pero filtrados por el tema padre. El módulo Tareas muestra todas las tareas asignadas al usuario, cross-temas.

## Ver también

- [Tareas](tareas.md) - Vista de tareas cross-temas
- [CRM](crm.md) - Clientes asociables a temas
