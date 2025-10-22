// Configuración de plazos de vencimiento por tipo de documento
// Este archivo permite configurar fácilmente los períodos de vencimiento para diferentes tipos de documentos

export interface DocumentExpirationConfig {
  sectionName: string;
  expirationDays: number;
  description: string;
  category: 'permiso' | 'obra' | 'informe' | 'tasa' | 'otro';
  conditionalDays?: {
    [key: string]: number;
  };
}

// Configuración de plazos de vencimiento
export const DOCUMENT_EXPIRATION_CONFIG: DocumentExpirationConfig[] = [
  // Permisos y documentación inicial
  {
    sectionName: 'Permiso de obra',
    expirationDays: 365, // 1 año
    description: 'Permiso municipal de construcción',
    category: 'permiso'
  },
  {
    sectionName: 'Planos aprobados',
    expirationDays: 365, // 1 año
    description: 'Planos arquitectónicos aprobados por el municipio',
    category: 'permiso'
  },
  {
    sectionName: 'Certificado de aptitud ambiental',
    expirationDays: 730, // 2 años
    description: 'Certificado ambiental para la construcción',
    category: 'permiso'
  },
  {
    sectionName: 'Estudio de suelos',
    expirationDays: 1095, // 3 años
    description: 'Estudio geotécnico del terreno',
    category: 'informe'
  },
  {
    sectionName: 'Consulta DGIUR',
    expirationDays: 180, // 180 días hábiles (aproximadamente 6 meses)
    description: 'Consulta a la Dirección General de Interpretación Urbanística',
    category: 'informe'
  },
  // Documentos de demolición con lógica especial
  {
    sectionName: 'Permiso de Demolición - Informe',
    expirationDays: 365, // 1 año para cargar Demolición
    description: 'Permiso para trabajos de demolición',
    category: 'permiso'
  },
  {
    sectionName: 'Registro etapa de proyecto',
    expirationDays: 730, // 2 años para iniciar el permiso de obra
    description: 'Registro de etapa de proyecto - 2 años para iniciar permiso de obra',
    category: 'permiso'
  },

  // Documentos de obra
  {
    sectionName: 'Alta Inicio de obra',
    expirationDays: 30, // 30 días por defecto
    description: 'Declaración de inicio de obra',
    category: 'obra',
    conditionalDays: {
      'Microobra': 730,  // 2 años
      'Obra Menor': 1095, // 3 años
      'Obra Media': 1460, // 4 años
      'Obra Mayor': 2190  // 6 años
    }
  },
  {
    sectionName: 'Cartel de Obra',
    expirationDays: 365, // 1 año
    description: 'Cartel identificatorio de la obra',
    category: 'obra'
  },
  {
    sectionName: 'Demolición',
    expirationDays: 365, // 1 año para finalizar demolición
    description: 'Documentación de trabajos de demolición',
    category: 'obra'
  },
  {
    sectionName: 'Excavación',
    expirationDays: 60, // 2 meses
    description: 'Documentación de trabajos de excavación',
    category: 'obra'
  },
  {
    sectionName: 'AVO 1',
    expirationDays: 180, // 6 meses
    description: 'Aviso de Obra 1 - Estructura',
    category: 'obra'
  },
  {
    sectionName: 'AVO 2',
    expirationDays: 180, // 6 meses
    description: 'Aviso de Obra 2 - Mampostería',
    category: 'obra'
  },
  {
    sectionName: 'AVO 3',
    expirationDays: 180, // 6 meses
    description: 'Aviso de Obra 3 - Instalaciones',
    category: 'obra'
  },

  // Informes especiales
  {
    sectionName: 'Informe de dominio',
    expirationDays: 90, // 3 meses
    description: 'Informe de dominio del inmueble',
    category: 'informe'
  },
  {
    sectionName: 'Informe de inhibición',
    expirationDays: 90, // 3 meses
    description: 'Informe de inhibición del inmueble',
    category: 'informe'
  },

  // Tasas y pagos
  {
    sectionName: 'Tasas municipales',
    expirationDays: 365, // 1 año
    description: 'Comprobantes de pago de tasas municipales',
    category: 'tasa'
  }
];

// Función para obtener la configuración de vencimiento de una sección
export function getExpirationConfig(sectionName: string): DocumentExpirationConfig | null {
  return DOCUMENT_EXPIRATION_CONFIG.find(config => config.sectionName === sectionName) || null;
}

// Función para obtener los días de vencimiento de una sección
export function getExpirationDays(sectionName: string, projectType?: string): number {
  const config = getExpirationConfig(sectionName);
  if (!config) return 365; // Default fallback
  
  // Si hay plazos condicionales y se proporciona el tipo de proyecto
  if (config.conditionalDays && projectType && config.conditionalDays[projectType]) {
    return config.conditionalDays[projectType];
  }
  
  return config.expirationDays;
}

// Función para calcular la fecha de vencimiento basada en la fecha de carga
export function calculateExpirationDate(uploadDate: string, sectionName: string, projectType?: string): string {
  const upload = new Date(uploadDate);
  
  // Para Consulta DGIUR, usar días hábiles
  if (sectionName === 'Consulta DGIUR') {
    try {
      const { calculateDGIURExpirationDate } = require('./utils/date-utils');
      const expiration = calculateDGIURExpirationDate(upload);
      return expiration.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    } catch (error) {
      console.warn('Error loading date-utils, using calendar days for DGIUR:', error);
      // Fallback a días calendario si no se puede cargar el módulo
      const expirationDays = getExpirationDays(sectionName, projectType);
      const expiration = new Date(upload);
      expiration.setDate(expiration.getDate() + expirationDays);
      return expiration.toISOString().split('T')[0];
    }
  }
  
  // Para otros documentos, usar días calendario
  const expirationDays = getExpirationDays(sectionName, projectType);
  const expiration = new Date(upload);
  expiration.setDate(expiration.getDate() + expirationDays);
  
  return expiration.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}

// Función para obtener la fecha actual en formato YYYY-MM-DD
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Función para calcular días restantes hasta el vencimiento
export function calculateDaysUntilExpiration(expirationDate: string): {
  days: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
  const today = new Date();
  const expiration = new Date(expirationDate);
  
  // Normalizar fechas para comparar solo días (sin horas)
  today.setHours(0, 0, 0, 0);
  expiration.setHours(0, 0, 0, 0);
  
  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    days: diffDays,
    isExpired: diffDays < 0,
    isExpiringSoon: diffDays >= 0 && diffDays <= 30 // Próximo a vencer en 30 días
  };
}

// Función para obtener todas las configuraciones por categoría
export function getConfigsByCategory(category: DocumentExpirationConfig['category']): DocumentExpirationConfig[] {
  return DOCUMENT_EXPIRATION_CONFIG.filter(config => config.category === category);
}

// Función para obtener un resumen de todas las configuraciones
export function getAllConfigurations(): DocumentExpirationConfig[] {
  return [...DOCUMENT_EXPIRATION_CONFIG];
}