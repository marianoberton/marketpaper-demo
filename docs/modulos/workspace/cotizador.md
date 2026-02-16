# Módulo Cotizador

> [Inicio](../../README.md) > [Módulos](../README.md) > Cotizador

## Descripción

Generador de cotizaciones y presupuestos comerciales. Actualmente es un módulo registrado en la plataforma con UI placeholder — la implementación completa está pendiente. La infraestructura (navegación, módulo en BD, sistema modular) ya lo soporta.

## Estado actual

**En construcción.** La página muestra un placeholder con el mensaje "Módulo de cotizaciones (en construcción)" y un ícono de calculadora. El módulo está registrado en el sistema de módulos y aparece en la navegación del workspace cuando está habilitado.

## Rutas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/workspace/cotizador` | `app/(workspace)/workspace/cotizador/page.tsx` | Server Component wrapper |
| — | `app/(workspace)/workspace/cotizador/client-page.tsx` | UI placeholder (client) |

## Registro en el sistema

El módulo está registrado en la migración `0038_seed_all_modules.sql`:

```sql
INSERT INTO modules (name, route_path, icon, category, display_order, is_core, description)
VALUES ('Cotizador', '/workspace/cotizador', 'Calculator', 'Workspace', 30, true,
        'Módulo de cotizaciones');
```

| Propiedad | Valor |
|-----------|-------|
| Ícono | `Calculator` (lucide-react) |
| Categoría | Workspace |
| Orden en sidebar | 30 (entre Mis Tareas y Ventas) |
| Es core | Sí (visible para todos los usuarios) |

## API endpoints

No tiene API routes dedicadas. Cuando se implemente, seguirá el patrón estándar:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/cotizador` | Listar/crear cotizaciones |
| GET/PUT/DELETE | `/api/workspace/cotizador/[id]` | CRUD individual |

## Infraestructura relacionada

### Campo `quote_id` en oportunidades

La tabla `opportunities` ya incluye un campo `quote_id UUID` preparado para vincular cotizaciones a oportunidades del pipeline de ventas.

### Esquema de ítems (referencia HubSpot)

El sistema HubSpot maneja dos formatos de ítems de cotización:

**Formato `mp_items_json` (custom):**
```typescript
{
  descripcion: string   // Descripción del ítem
  cantidad: number      // Cantidad
  precio: number        // Precio unitario
  subtotal: number      // Cantidad × Precio
  aCotizar?: boolean    // Pendiente de cotizar
}
```

**Formato nativo HubSpot (line items):**
```typescript
{
  quantity: number
  price: number
  mp_tipo_caja?: string    // Tipo de caja
  mp_largo_mm?: number     // Dimensiones
  mp_ancho_mm?: number
  mp_alto_mm?: number
}
```

### Análisis de precios

`lib/hubspot/price-analysis.ts` implementa lógica de validación de precios cotizados contra promedios de mercado por zona:

| Zona | Rango USD/m² | Promedio |
|------|-------------|----------|
| AMBA | 550–750 | 650 |
| Interior | 600–850 | 725 |
| Exportación | 500–700 | 600 |

Clasificación: `in_range` (verde), `below_market` (amarillo), `above_market` (rojo).

### Simulador de pagos

El módulo Simulador (`/workspace/Simulador`) contiene funcionalidad adyacente:
- Simulación de honorarios profesionales (encomiendas)
- Cálculo de derechos de construcción
- Cálculo de plusvalía

Usa el componente `ProfessionalFeesSimulator` del módulo Construcción con tarifas escalonadas por superficie.

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `app/(workspace)/workspace/cotizador/page.tsx` | Server Component wrapper |
| `app/(workspace)/workspace/cotizador/client-page.tsx` | UI placeholder |
| `lib/hubspot/price-analysis.ts` | Análisis de precios de mercado |
| `lib/hubspot-analytics-types.ts` | Tipos de ítems de cotización |
| `supabase/migrations/0047_create_opportunities.sql` | Campo `quote_id` |

## Ver también

- [Oportunidades](oportunidades.md) — Pipeline de ventas con campo `quote_id`
- [HubSpot](hubspot.md) — Propiedades de cotización (`mp_items_json`, precios)
- [Construcción](construccion.md) — Simulador de honorarios profesionales
