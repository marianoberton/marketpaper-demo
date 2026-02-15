/**
 * Shared UI utilities for the Construction module.
 * Centralizes visual helpers used across multiple components.
 */

/** Returns a Tailwind bg-color class for a given project stage name. */
export const getStageColor = (stage: string): string => {
  const stageColors: Record<string, string> = {
    // Prefactibilidad
    'Prefactibilidad del proyecto': 'bg-purple-500',

    // En Gestoria
    'Consulta DGIUR': 'bg-yellow-500',
    'Registro etapa de proyecto': 'bg-yellow-600',
    'Permiso de obra': 'bg-yellow-700',

    // En ejecución de obra
    'Demolición': 'bg-red-500',
    'Excavación': 'bg-red-600',
    'AVO 1': 'bg-green-500',
    'AVO 2': 'bg-green-600',
    'AVO 3': 'bg-green-700',

    // Finalización
    'Conforme de obra': 'bg-emerald-600',
    'MH-SUBDIVISION': 'bg-emerald-700',

    // Compatibilidad temporal con etapas antiguas
    'Planificación': 'bg-gray-500',
    'Permisos': 'bg-yellow-500',
    'Finalización': 'bg-emerald-600',
  }
  return stageColors[stage] || 'bg-blue-500'
}
