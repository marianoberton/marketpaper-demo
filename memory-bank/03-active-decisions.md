# Decisiones Activas

Este archivo mantiene un registro de las decisiones arquitectónicas y técnicas vigentes en el proyecto.

## [2025-01-10] Estructura de carpetas en Supabase Storage

**Contexto**: Se evaluó si cambiar la estructura actual del bucket de usar IDs a usar nombres legibles para organizar archivos de empresas y proyectos.

**Alternativas consideradas**:
- A) Mantener estructura actual: `{companyId}/projects/{projectId}/{section}/{timestamp-filename}`
- B) Cambiar a nombres: `{companyName}/projects/{projectName}/{section}/{timestamp-filename}`
- C) Híbrido: `{companyName}-{companyId}/projects/{projectName}-{projectId}/{section}/{timestamp-filename}`

**Decisión**: Mantener la estructura actual con IDs (Alternativa A)

**Rationale**:
- **Unicidad garantizada**: Los UUIDs son únicos por diseño, evitando colisiones
- **Inmutabilidad**: Si cambia el nombre de empresa/proyecto, no requiere migración de archivos
- **Seguridad**: Los IDs no revelan información sensible del negocio
- **Compatibilidad**: Funciona con cualquier carácter en nombres (acentos, espacios, símbolos)
- **Performance**: Búsquedas más rápidas en base de datos por índices en UUIDs
- **Estándares**: Sigue mejores prácticas de la industria para storage

**Consecuencias**:
- ✅ **Positivas**: Sistema robusto, escalable y sin riesgo de conflictos
- ⚠️ **Negativas**: Menor legibilidad para debugging manual (mitigable con herramientas de admin)
- 🔧 **Mitigación**: Implementar mapeo ID→nombre en herramientas de administración si es necesario

**Impacto**: Ninguno - se mantiene el status quo. La estructura actual es correcta y bien diseñada.

---

## [2025-01-10] Unificación de campos de carga de archivos

**Contexto**: Los campos de carga de documentos en diferentes secciones tenían estilos inconsistentes.

**Decisión**: Estandarizar todos los campos de carga con el patrón:
- Input oculto (`type="file"` con `className="hidden"`)
- Botón personalizado con `size="sm"`, `variant="outline"`, `className="w-full text-xs"`
- Icono `Upload` con `className="h-3 w-3 mr-1"`

**Rationale**: Consistencia visual y mejor UX en toda la aplicación.

**Impacto**: Mejora la experiencia de usuario y mantiene coherencia en el diseño.