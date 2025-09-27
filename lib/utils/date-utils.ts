// Utilidades para manejo de fechas en horario argentino (UTC-3)

/**
 * Obtiene la fecha actual en horario argentino
 */
export const getArgentinaDate = (): Date => {
  const now = new Date();
  // Argentina está en UTC-3 (o UTC-2 en horario de verano, pero usaremos UTC-3 como estándar)
  const argentinaOffset = -3 * 60; // -3 horas en minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const argentinaTime = new Date(utc + (argentinaOffset * 60000));
  return argentinaTime;
};

/**
 * Convierte una fecha a horario argentino
 */
export const toArgentinaDate = (date: Date | string): Date => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const argentinaOffset = -3 * 60; // -3 horas en minutos
  const utc = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60000);
  const argentinaTime = new Date(utc + (argentinaOffset * 60000));
  return argentinaTime;
};

/**
 * Formatea una fecha en formato argentino (dd/mm/yyyy)
 */
export const formatArgentinaDate = (date: Date | string): string => {
  const argentinaDate = typeof date === 'string' ? toArgentinaDate(new Date(date)) : toArgentinaDate(date);
  return argentinaDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  });
};

/**
 * Formatea una fecha en formato argentino completo (dd de mmmm de yyyy)
 */
export const formatArgentinaDateLong = (date: Date | string): string => {
  const argentinaDate = typeof date === 'string' ? toArgentinaDate(new Date(date)) : toArgentinaDate(date);
  return argentinaDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  });
};

/**
 * Calcula la fecha de vencimiento (1 año después de la fecha de carga)
 */
export const calculateExpirationDate = (uploadDate: Date | string): Date => {
  const baseDate = typeof uploadDate === 'string' ? new Date(uploadDate) : uploadDate;
  const argentinaUploadDate = toArgentinaDate(baseDate);
  
  // Agregar 1 año
  const expirationDate = new Date(argentinaUploadDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  
  return expirationDate;
};

/**
 * Calcula los días restantes hasta el vencimiento
 */
export const calculateDaysUntilExpiration = (expirationDate: Date | string): {
  days: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
} => {
  const expiry = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  const today = getArgentinaDate();
  
  // Normalizar fechas a medianoche para comparación precisa
  const expiryNormalized = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = expiryNormalized.getTime() - todayNormalized.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    days: diffDays,
    isExpired: diffDays < 0,
    isExpiringSoon: diffDays >= 0 && diffDays <= 30 // Próximo a vencer en 30 días
  };
};

/**
 * Convierte una fecha a formato ISO para almacenamiento en base de datos
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD para inputs de tipo date
 */
export const getTodayInputValue = (): string => {
  const today = getArgentinaDate();
  return today.toISOString().split('T')[0];
};