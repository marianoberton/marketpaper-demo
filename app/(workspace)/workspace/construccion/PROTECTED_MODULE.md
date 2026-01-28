# Módulo Protegido: Construcción

⚠️ **ATENCIÓN DESARROLLADORES** ⚠️

Este módulo (`/construccion`) es el **ÚNICO** módulo en producción activa. Es crítico para la operación del negocio.

## Reglas de Desarrollo

1.  **No romper la funcionalidad existente**: Antes de hacer cambios, asegúrese de entender el impacto.
2.  **Tests Obligatorios**: Cualquier lógica nueva o cambio en lógica existente debe ir acompañado de tests unitarios.
    - Ejecutar tests: `npm run test`
    - Ubicación de tests: `lib/__tests__` o `__tests__` dentro de los directorios de componentes.
3.  **Dependencias**: Tenga cuidado al modificar componentes compartidos en `@/components/ui` o funciones en `@/lib` que este módulo consuma.
4.  **Revisiones**: Todo cambio aquí requiere aprobación explícita.

## Estado del Módulo

- **Estado**: Producción (Estable)
- **Cobertura de Tests**: Parcial (Lógica crítica en `lib/construction-deadlines.ts` cubierta).
- **Contacto**: Equipo de Desarrollo / Tech Lead.

Consulte `PLATFORM_STATUS.md` en la raíz para más información.
