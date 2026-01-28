/**
 * @fileoverview Unit tests for construction-deadlines.ts pure functions
 * These tests do NOT interact with the database - they only test pure business logic.
 * SAFE TO RUN: No database operations are performed.
 * 
 * NOTE: We inline the pure functions here because the original module initializes
 * a Supabase client at module load time, which fails in test environment.
 * These functions are exact copies from lib/construction-deadlines.ts
 */

import { describe, it, expect } from 'vitest'

// Types copied from the original module
interface DeadlineStatusInfo {
  status: 'pending' | 'active' | 'warning' | 'expired';
  daysRemaining: number;
  statusText: string;
  statusColor: 'gray' | 'green' | 'yellow' | 'red';
  urgencyLevel: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Calcula el estado del plazo basado en días restantes
 * COPIED FROM: lib/construction-deadlines.ts
 */
function calculateDeadlineStatus(daysRemaining: number): DeadlineStatusInfo {
  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      statusText: `Vencido hace ${Math.abs(daysRemaining)} días`,
      statusColor: 'red',
      urgencyLevel: 'high'
    };
  } else if (daysRemaining <= 30) {
    return {
      status: 'warning',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'red',
      urgencyLevel: 'high'
    };
  } else if (daysRemaining <= 90) {
    return {
      status: 'warning',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'yellow',
      urgencyLevel: 'medium'
    };
  } else if (daysRemaining <= 180) {
    return {
      status: 'active',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'yellow',
      urgencyLevel: 'low'
    };
  } else {
    return {
      status: 'active',
      daysRemaining,
      statusText: `${daysRemaining} días restantes`,
      statusColor: 'green',
      urgencyLevel: 'none'
    };
  }
}

/**
 * Formatea los días restantes en un texto legible
 * COPIED FROM: lib/construction-deadlines.ts
 */
function formatTimeRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const absDays = Math.abs(daysRemaining);
    if (absDays < 30) {
      return `Vencido hace ${absDays} días`;
    } else if (absDays < 365) {
      const months = Math.floor(absDays / 30);
      return `Vencido hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(absDays / 365);
      return `Vencido hace ${years} ${years === 1 ? 'año' : 'años'}`;
    }
  }

  if (daysRemaining < 30) {
    return `${daysRemaining} días restantes`;
  } else if (daysRemaining < 365) {
    const months = Math.floor(daysRemaining / 30);
    const remainingDays = daysRemaining % 30;
    if (remainingDays === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${months}m ${remainingDays}d`;
  } else {
    const years = Math.floor(daysRemaining / 365);
    const remainingMonths = Math.floor((daysRemaining % 365) / 30);
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
    return `${years}a ${remainingMonths}m`;
  }
}

describe('construction-deadlines - Pure Functions', () => {
  
  describe('calculateDeadlineStatus', () => {
    
    describe('expired status (days < 0)', () => {
      it('should return expired status for -1 day', () => {
        const result = calculateDeadlineStatus(-1)
        
        expect(result.status).toBe('expired')
        expect(result.daysRemaining).toBe(-1)
        expect(result.statusColor).toBe('red')
        expect(result.urgencyLevel).toBe('high')
        expect(result.statusText).toBe('Vencido hace 1 días')
      })

      it('should return expired status for -30 days', () => {
        const result = calculateDeadlineStatus(-30)
        
        expect(result.status).toBe('expired')
        expect(result.daysRemaining).toBe(-30)
        expect(result.statusColor).toBe('red')
        expect(result.urgencyLevel).toBe('high')
        expect(result.statusText).toBe('Vencido hace 30 días')
      })

      it('should return expired status for -365 days', () => {
        const result = calculateDeadlineStatus(-365)
        
        expect(result.status).toBe('expired')
        expect(result.daysRemaining).toBe(-365)
        expect(result.statusText).toBe('Vencido hace 365 días')
      })
    })

    describe('warning status with high urgency (0-30 days)', () => {
      it('should return warning with high urgency for 0 days', () => {
        const result = calculateDeadlineStatus(0)
        
        expect(result.status).toBe('warning')
        expect(result.daysRemaining).toBe(0)
        expect(result.statusColor).toBe('red')
        expect(result.urgencyLevel).toBe('high')
      })

      it('should return warning with high urgency for 15 days', () => {
        const result = calculateDeadlineStatus(15)
        
        expect(result.status).toBe('warning')
        expect(result.statusColor).toBe('red')
        expect(result.urgencyLevel).toBe('high')
        expect(result.statusText).toBe('15 días restantes')
      })

      it('should return warning with high urgency for 30 days', () => {
        const result = calculateDeadlineStatus(30)
        
        expect(result.status).toBe('warning')
        expect(result.statusColor).toBe('red')
        expect(result.urgencyLevel).toBe('high')
      })
    })

    describe('warning status with medium urgency (31-90 days)', () => {
      it('should return warning with medium urgency for 31 days', () => {
        const result = calculateDeadlineStatus(31)
        
        expect(result.status).toBe('warning')
        expect(result.statusColor).toBe('yellow')
        expect(result.urgencyLevel).toBe('medium')
      })

      it('should return warning with medium urgency for 60 days', () => {
        const result = calculateDeadlineStatus(60)
        
        expect(result.status).toBe('warning')
        expect(result.statusColor).toBe('yellow')
        expect(result.urgencyLevel).toBe('medium')
        expect(result.statusText).toBe('60 días restantes')
      })

      it('should return warning with medium urgency for 90 days', () => {
        const result = calculateDeadlineStatus(90)
        
        expect(result.status).toBe('warning')
        expect(result.statusColor).toBe('yellow')
        expect(result.urgencyLevel).toBe('medium')
      })
    })

    describe('active status with low urgency (91-180 days)', () => {
      it('should return active with low urgency for 91 days', () => {
        const result = calculateDeadlineStatus(91)
        
        expect(result.status).toBe('active')
        expect(result.statusColor).toBe('yellow')
        expect(result.urgencyLevel).toBe('low')
      })

      it('should return active with low urgency for 120 days', () => {
        const result = calculateDeadlineStatus(120)
        
        expect(result.status).toBe('active')
        expect(result.statusColor).toBe('yellow')
        expect(result.urgencyLevel).toBe('low')
      })

      it('should return active with low urgency for 180 days', () => {
        const result = calculateDeadlineStatus(180)
        
        expect(result.status).toBe('active')
        expect(result.statusColor).toBe('yellow')
        expect(result.urgencyLevel).toBe('low')
      })
    })

    describe('active status with no urgency (>180 days)', () => {
      it('should return active with no urgency for 181 days', () => {
        const result = calculateDeadlineStatus(181)
        
        expect(result.status).toBe('active')
        expect(result.statusColor).toBe('green')
        expect(result.urgencyLevel).toBe('none')
      })

      it('should return active with no urgency for 365 days', () => {
        const result = calculateDeadlineStatus(365)
        
        expect(result.status).toBe('active')
        expect(result.statusColor).toBe('green')
        expect(result.urgencyLevel).toBe('none')
        expect(result.statusText).toBe('365 días restantes')
      })

      it('should return active with no urgency for 730 days (2 years)', () => {
        const result = calculateDeadlineStatus(730)
        
        expect(result.status).toBe('active')
        expect(result.statusColor).toBe('green')
        expect(result.urgencyLevel).toBe('none')
      })
    })
  })

  describe('formatTimeRemaining', () => {
    
    describe('expired dates (negative days)', () => {
      it('should format "Vencido hace X días" for days < 30', () => {
        expect(formatTimeRemaining(-5)).toBe('Vencido hace 5 días')
        expect(formatTimeRemaining(-29)).toBe('Vencido hace 29 días')
      })

      it('should format "Vencido hace X meses" for days 30-364', () => {
        expect(formatTimeRemaining(-30)).toBe('Vencido hace 1 mes')
        expect(formatTimeRemaining(-60)).toBe('Vencido hace 2 meses')
        expect(formatTimeRemaining(-90)).toBe('Vencido hace 3 meses')
      })

      it('should format "Vencido hace X años" for days >= 365', () => {
        expect(formatTimeRemaining(-365)).toBe('Vencido hace 1 año')
        expect(formatTimeRemaining(-730)).toBe('Vencido hace 2 años')
      })
    })

    describe('future dates (positive days)', () => {
      it('should format "X días restantes" for days < 30', () => {
        expect(formatTimeRemaining(0)).toBe('0 días restantes')
        expect(formatTimeRemaining(1)).toBe('1 días restantes')
        expect(formatTimeRemaining(29)).toBe('29 días restantes')
      })

      it('should format months for days 30-364', () => {
        expect(formatTimeRemaining(30)).toBe('1 mes')
        expect(formatTimeRemaining(60)).toBe('2 meses')
        expect(formatTimeRemaining(45)).toBe('1m 15d')
        expect(formatTimeRemaining(75)).toBe('2m 15d')
      })

      it('should format years for days >= 365', () => {
        expect(formatTimeRemaining(365)).toBe('1 año')
        expect(formatTimeRemaining(730)).toBe('2 años')
        expect(formatTimeRemaining(400)).toBe('1a 1m')
        expect(formatTimeRemaining(500)).toBe('1a 4m')
      })
    })
  })
})
