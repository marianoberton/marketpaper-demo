# Módulo HubSpot

> [Inicio](../../README.md) > [Módulos](../README.md) > HubSpot

## Descripción

Módulo de analytics de ventas integrado con HubSpot. Muestra métricas de deals, pipeline, line items, y genera planes de acción con IA. Requiere tener credenciales de HubSpot configuradas en la empresa.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/hubspot` | Dashboard de analytics HubSpot |

## Tabs disponibles

| Tab | Componente | Descripción |
|-----|-----------|-------------|
| Overview | `overview-tab.tsx` | KPIs principales, métricas del día |
| Pipeline | `pipeline-tab.tsx` | Funnel de ventas por etapa |
| Seguimiento | `seguimiento-tab.tsx` | Tracking de deals individuales |
| Pedidos | `pedidos-tab.tsx` | Órdenes y line items |
| Line Items | `all-line-items-tab.tsx` | Todos los line items |
| Precios | `price-analysis-tab.tsx` | Análisis de precios con IA |
| Reportes | `reportes-tab.tsx` | Reportes generales |

## Server Actions (no API routes)

Este módulo usa Server Actions en vez de API routes:

| Archivo | Propósito |
|---------|-----------|
| `actions/hubspot-analytics.ts` | Fetch de datos de HubSpot |
| `actions/hubspot-price-analysis.ts` | Análisis de precios |
| `actions/hubspot-test.ts` | Testing de integración |

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `company_integrations` | Credenciales cifradas de HubSpot |
| `hubspot_action_plans` | Planes de acción generados por IA |

## Componentes principales

| Componente | Propósito |
|------------|-----------|
| `kpi-cards` | Tarjetas de KPIs |
| `pipeline-funnel` | Gráfico de funnel |
| `deal-detail-sheet` | Detalle de un deal |
| `action-plan-card` | Plan de acción IA |
| `price-indicator` | Indicador de tendencia de precios |
| `daily-report` | Reporte diario |
| `csv-export-button` | Exportar datos a CSV |
| `date-range-picker` | Filtro de fechas |

## Integración con HubSpot

### Configuración
Las credenciales se guardan cifradas en `company_integrations` con provider `hubspot`.

### Datos que consume
- **Deals**: Pipeline de ventas, etapas, montos
- **Contacts**: Contactos asociados a deals
- **Line Items**: Productos/servicios de cada deal
- **Owners**: Vendedores asignados

### Gotcha importante
Al acceder a asociaciones de deals, la API de HubSpot retorna las keys con **espacios** en vez de underscores:

```typescript
// Request usa underscores
basicApi.getById(id, ..., ['line_items'])

// Response usa espacios
deal.associations?.['line items']?.results  // ✅
deal.associations?.['line_items']?.results  // ❌ no funciona
```

## Archivos de lógica

| Archivo | Propósito |
|---------|-----------|
| `lib/hubspot.ts` | Cliente principal de HubSpot |
| `lib/hubspot/index.ts` | Exports |
| `lib/hubspot/ai-action-plan.ts` | Generación de planes de acción con IA |
| `lib/hubspot/price-analysis.ts` | Análisis de precios |
| `lib/hubspot-analytics-types.ts` | Tipos TypeScript |

## Ver también

- [CRM](crm.md) - Gestión de leads local
- [Oportunidades](oportunidades.md) - Pipeline local
- [Seguridad](../../arquitectura/seguridad.md) - Cifrado de credenciales
