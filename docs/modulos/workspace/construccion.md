# Módulo de Construcción

> [Inicio](../../README.md) > [Módulos](../README.md) > Construcción

## Descripción

Módulo de gestión de proyectos de construcción. Permite administrar todo el ciclo de vida de una obra: documentación, etapas, plazos legales, pagos, impuestos, profesionales y clientes.

Es el módulo más complejo de la plataforma, con ~44 componentes específicos.

## Rutas del frontend

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/workspace/construccion` | `page.tsx` + `client-page.tsx` | Dashboard de construcción |
| Debug upload | `debug-upload/page.tsx` | Herramienta de debug para uploads |

## API endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/workspace/construction/projects` | Listar/crear proyectos |
| GET/PUT | `/api/workspace/construction/projects/[id]/dates` | Fechas del proyecto |
| GET/POST/PUT/DELETE | `/api/workspace/construction/clients` | Gestión de clientes |
| GET/POST/PUT/DELETE | `/api/workspace/construction/documents` | CRUD de documentos |
| GET/POST | `/api/workspace/construction/document-relationships` | Relaciones entre docs |
| GET/POST/PUT | `/api/workspace/construction/expiration-dates` | Vencimientos de docs |
| GET/POST | `/api/workspace/construction/payment-receipts` | Comprobantes de pago |
| GET/POST/PUT | `/api/workspace/construction/project-stages` | Etapas de obra |
| GET/POST | `/api/workspace/construction/stage-completions` | Progreso de etapas |
| GET/POST | `/api/workspace/construction/tax-payments` | Impuestos |
| PUT/DELETE | `/api/workspace/construction/tax-payments/[id]` | Gestión de impuestos |
| GET/POST/PUT | `/api/workspace/construction/upload-dates` | Fechas de subida |

## Tablas de base de datos

| Tabla | Propósito |
|-------|-----------|
| `projects` | Proyectos de construcción (tabla principal) |
| `clients` | Clientes de las empresas |
| `project_documents` | Documentos adjuntos |
| `project_expiration_dates` | Vencimientos de documentos |
| `project_upload_dates` | Fechas de subida |
| `document_relationships` | Relaciones entre documentos |
| `payment_receipts` | Comprobantes de pago |
| `project_stages` | Etapas de obra |
| `project_stage_completions` | Progreso de etapas |
| `tax_payments` | Pagos de impuestos |
| `professional_commissions` | Honorarios profesionales |
| `professional_councils` | Colegios profesionales |
| `construction_deadline_rules` | Reglas de cálculo de plazos |
| `construction_rights` | Derechos de propiedad |
| `surplus_value_rights` | Plusvalía |
| `surplus_value_zones` | Zonas de plusvalía |
| `project_expedientes` | Expedientes legales |
| `project_sections` | Secciones/subdivisiones |
| `project_status_history` | Historial de cambios de estado |

## Componentes principales

| Componente | Propósito |
|------------|-----------|
| `ConstruccionDashboard` | Dashboard principal |
| `ProjectList` / `ProjectCard` | Listado de proyectos |
| `ProjectDetail` / `ProjectHeader` | Detalle del proyecto |
| `ProjectTabs` | Navegación por tabs del proyecto |
| `ProjectSummaryTab` | Resumen general |
| `ProjectDocumentsTab` | Gestión documental |
| `ProjectEconomicTab` | Vista financiera |
| `ProjectStagesTab` | Etapas de obra |
| `ProjectTeamTab` | Equipo del proyecto |
| `CreateProjectModal` | Crear proyecto nuevo |
| `DocumentSection` / `DocumentCard` / `DocumentUpload` | Documentos |
| `DocumentPreviewModal` | Preview de documentos |
| `DocumentExpirationConfig` | Configurar vencimientos |
| `ContractSection` | Contratos |
| `DeadlineNotifications` / `DeadlineStatus` | Alertas de plazos |
| `PaymentsList` / `PaymentFormModal` | Gestión de pagos |
| `ProfessionalFeesSimulator` | Simulador de honorarios |
| `ClientManagement` / `ClientInfoCard` | Gestión de clientes |

## Funcionalidades clave

### Gestión documental
- Upload de documentos con categorización
- Tracking de vencimientos con alertas
- Relaciones entre documentos
- Preview en modal

### Etapas de obra
- Definición de etapas secuenciales
- Tracking de completitud por etapa
- Historial de progreso

### Plazos legales
- Cálculo automático de deadlines basado en reglas configurables
- Notificaciones de vencimiento
- Panel de plazos para clientes

### Gestión financiera
- Comprobantes de pago
- Impuestos de construcción
- Simulador de honorarios profesionales
- Resumen económico con charts

## Archivos de lógica de negocio

| Archivo | Propósito |
|---------|-----------|
| `lib/construction.ts` | Tipos e interfaces |
| `lib/construction-deadlines.ts` | Cálculo de plazos |
| `lib/construction-ui.ts` | Helpers de UI |
| `lib/document-expiration-config.ts` | Configuración de vencimientos |

## Ver también

- [CRM](crm.md) - Gestión de clientes (complementario)
- [Finanzas](finanzas.md) - Gestión financiera general
- [Crear un Módulo Nuevo](../../guias/crear-modulo-nuevo.md) - Referencia de patrones
