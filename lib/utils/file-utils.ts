/**
 * Utilidades para manejo de archivos y rutas de Supabase Storage
 */

/**
 * Sanitiza un nombre de archivo para que sea compatible con Supabase Storage
 * - Remueve caracteres especiales
 * - Reemplaza espacios con guiones
 * - Remueve acentos y caracteres no ASCII
 * - Convierte a minúsculas
 */
export function sanitizeFileName(fileName: string): string {
  // Obtener nombre y extensión
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  
  // Sanitizar el nombre
  let sanitizedName = name
    // Normalizar caracteres Unicode (remover acentos)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    // Remover múltiples guiones consecutivos
    .replace(/-+/g, '-')
    // Remover guiones al inicio y final
    .replace(/^-+|-+$/g, '')
    // Convertir a minúsculas
    .toLowerCase();
  
  // Si el nombre queda vacío, usar un nombre por defecto
  if (!sanitizedName) {
    sanitizedName = 'archivo';
  }
  
  return sanitizedName + extension.toLowerCase();
}

/**
 * Sanitiza una ruta completa de archivo
 */
export function sanitizeFilePath(path: string): string {
  return path
    .split('/')
    .map(segment => {
      // Si el segmento parece ser un nombre de archivo (tiene extensión)
      if (segment.includes('.') && segment.lastIndexOf('.') > 0) {
        return sanitizeFileName(segment);
      }
      // Si es un directorio, solo sanitizar sin extensión
      return segment
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    })
    .join('/');
}

/**
 * Genera una ruta única para un archivo con timestamp
 */
export function generateUniqueFilePath({
  companyId,
  projectId,
  section,
  fileName
}: {
  companyId: string;
  projectId?: string;
  section: string;
  fileName: string;
}): string {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(fileName);
  const sanitizedSection = section
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  
  if (projectId) {
    return `${companyId}/projects/${projectId}/${sanitizedSection}/${timestamp}-${sanitizedFileName}`;
  }
  
  return `${companyId}/${sanitizedSection}/${timestamp}-${sanitizedFileName}`;
}