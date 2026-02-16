# Módulo de Finanzas

> [Inicio](../../README.md) > [Módulos](../README.md) > Finanzas

## Descripción

Módulo de gestión de gastos y finanzas de la empresa. Permite registrar gastos, organizarlos por categorías, importar datos desde CSV, y visualizar analytics.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/workspace/finanzas` | Dashboard de finanzas con charts y lista de gastos |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/workspace/finanzas/expenses` | CRUD de gastos |
| GET/POST/PUT/DELETE | `/api/workspace/finanzas/categories` | Gestión de categorías |
| POST | `/api/workspace/finanzas/import` | Importar gastos desde CSV |
| POST | `/api/workspace/finanzas/upload` | Upload de archivos |

## Tablas

| Tabla | Propósito |
|-------|-----------|
| `expenses` | Registros de gastos |
| `categories` | Categorías de gastos |
| `imported_files` | Tracking de archivos importados |

## Componentes

| Componente | Propósito |
|------------|-----------|
| `FinanzasDashboard` | Dashboard con métricas y charts |
| `ExpenseList` | Lista de gastos con filtros |
| `ExpenseModal` | Crear/editar gasto |
| `CategoryManager` | CRUD de categorías |
| `ImportModal` | Importar CSV |

## Funcionalidades

- Registro de gastos con monto, fecha, categoría y descripción
- Categorías personalizables por empresa
- Importación masiva desde CSV
- Charts de distribución por categoría y tendencia temporal
- Filtros por fecha, categoría y monto

## Ver también

- [Construcción](construccion.md) - Tiene su propia vista económica
