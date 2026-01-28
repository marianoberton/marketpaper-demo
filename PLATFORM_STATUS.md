# Estado de la Plataforma MarketPaper

Este documento detalla el estado actual de la plataforma, los módulos activos y el plan de desarrollo.

## 🟢 Módulos Activos (Producción)

Actualmente, solo el módulo de **Construcción** se encuentra en uso activo y debe ser protegido contra regresiones.

### 🏗️ Módulo de Construcción (`/app/(workspace)/workspace/construccion`)
Este es el núcleo actual de la plataforma. Permite la gestión integral de proyectos de construcción.

**Funcionalidades Principales:**
- **Gestión de Proyectos**:
  - Listado y creación de proyectos.
  - Seguimiento de etapas (Demolición, Excavación, Obra, etc.).
  - Gestión de trámites y verificaciones (DGIUR, Permisos).
- **Gestión de Clientes**:
  - Base de datos de clientes con referentes y contactos.
- **Gestión Documental**:
  - Carga y clasificación de documentos (Dominio, Seguros, Planos).
  - Control de vencimientos y alertas.
- **Gestión Económica**:
  - Seguimiento de pagos y gastos.
  - Simulador de honorarios profesionales.
- **Equipo y Profesionales**:
  - Asignación de profesionales a proyectos.

**Protección del Módulo:**
- Este módulo es **CRÍTICO**.
- Cualquier cambio en librerías compartidas debe ser verificado contra este módulo.
- Se implementarán tests automatizados para asegurar su estabilidad.

---

## 🟡 Módulos en Desarrollo / Inactivos

Los siguientes módulos existen en la estructura del proyecto pero no están en uso productivo o están en fase de prototipo. Su desarrollo no debe afectar el funcionamiento del módulo de Construcción.

- **CRM** (`/crm`): Gestión de leads, campañas y pipeline.
- **Finanzas** (`/finanzas`): Gestión financiera general (separada de la de construcción).
- **Simulador** (`/Simulador`): Herramientas de simulación (estado desconocido).
- **Analytics** (`/analytics`): Reportes y análisis de datos.
- **Bots/Chat** (`/bots`, `/chat`): Automatización y comunicación.
- **Otros**: `calendar`, `email`, `marketing`, `social`, `team`, `technical`.

---

## 🛡️ Plan de Protección

Para garantizar la estabilidad del módulo de Construcción mientras se desarrollan los demás:

1.  **Tests Automatizados**: Se implementará una suite de tests para el módulo de construcción.
2.  **Separación de Dependencias**: Evitar acoplamiento innecesario entre el módulo de construcción y los nuevos desarrollos.
3.  **Revisión Estricta**: Todo PR/cambio que toque `app/(workspace)/workspace/construccion` o `lib/construction` requiere revisión exhaustiva.
