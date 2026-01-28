/**
 * @fileoverview Unit tests for construction.ts pure functions
 * These tests do NOT interact with the database - they only test pure business logic.
 * SAFE TO RUN: No database operations are performed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Import only the pure functions that don't require database
import {
  calculateDomainReportDaysRemaining,
  isDomainReportValid,
  formatDomainReportStatus,
  calculateInsurancePolicyDaysRemaining,
  isInsurancePolicyValid,
  formatInsurancePolicyStatus,
  calculateProjectedVsPaidPercentage,
  formatCurrency,
  calculateRemainingAmount,
  calculateTaxSummary,
  calculateInhibitionReportDaysRemaining,
  isInhibitionReportValid,
  formatInhibitionReportStatus,
  type TaxSummary
} from '@/lib/construction'

import type { Project } from '@/lib/construction'

// Helper to create a date N days from now
const daysFromNow = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// Helper to create a date N days ago
const daysAgo = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

describe('construction.ts - Pure Functions', () => {
  
  describe('Domain Report Functions', () => {
    
    describe('calculateDomainReportDaysRemaining', () => {
      it('should return 90 days for a report uploaded today', () => {
        const today = new Date().toISOString().split('T')[0]
        const result = calculateDomainReportDaysRemaining(today)
        
        // Should be approximately 90 days (±1 for time zone issues)
        expect(result).toBeGreaterThanOrEqual(89)
        expect(result).toBeLessThanOrEqual(91)
      })

      it('should return approximately 60 days for a report uploaded 30 days ago', () => {
        const uploadDate = daysAgo(30)
        const result = calculateDomainReportDaysRemaining(uploadDate)
        
        expect(result).toBeGreaterThanOrEqual(59)
        expect(result).toBeLessThanOrEqual(61)
      })

      it('should return 0 for a report uploaded 90+ days ago', () => {
        const uploadDate = daysAgo(100)
        const result = calculateDomainReportDaysRemaining(uploadDate)
        
        expect(result).toBe(0)
      })
    })

    describe('isDomainReportValid', () => {
      it('should return false for null uploadDate', () => {
        expect(isDomainReportValid(null)).toBe(false)
      })

      it('should return true for recent upload', () => {
        const today = new Date().toISOString().split('T')[0]
        expect(isDomainReportValid(today)).toBe(true)
      })

      it('should return false for expired report', () => {
        const oldDate = daysAgo(100)
        expect(isDomainReportValid(oldDate)).toBe(false)
      })
    })

    describe('formatDomainReportStatus', () => {
      it('should return "none" status for null uploadDate', () => {
        const result = formatDomainReportStatus(null)
        
        expect(result.status).toBe('none')
        expect(result.message).toBe('No cargado')
        expect(result.daysRemaining).toBeUndefined()
      })

      it('should return "valid" status for recent report with > 10 days', () => {
        const uploadDate = daysAgo(30) // 60 days remaining
        const result = formatDomainReportStatus(uploadDate)
        
        expect(result.status).toBe('valid')
        expect(result.daysRemaining).toBeGreaterThan(10)
      })

      it('should return "expiring" status for report with <= 10 days', () => {
        const uploadDate = daysAgo(85) // ~5 days remaining
        const result = formatDomainReportStatus(uploadDate)
        
        expect(result.status).toBe('expiring')
        expect(result.daysRemaining).toBeLessThanOrEqual(10)
      })

      it('should return "expired" status for old report', () => {
        const uploadDate = daysAgo(100)
        const result = formatDomainReportStatus(uploadDate)
        
        expect(result.status).toBe('expired')
        expect(result.message).toBe('Vencido')
        expect(result.daysRemaining).toBe(0)
      })
    })
  })

  describe('Insurance Policy Functions', () => {
    
    describe('calculateInsurancePolicyDaysRemaining', () => {
      it('should return positive days for future expiry date', () => {
        const futureDate = daysFromNow(60)
        const result = calculateInsurancePolicyDaysRemaining(futureDate)
        
        expect(result).toBeGreaterThanOrEqual(59)
        expect(result).toBeLessThanOrEqual(61)
      })

      it('should return 0 for past expiry date', () => {
        const pastDate = daysAgo(10)
        const result = calculateInsurancePolicyDaysRemaining(pastDate)
        
        expect(result).toBe(0)
      })
    })

    describe('isInsurancePolicyValid', () => {
      it('should return false for null expiryDate', () => {
        expect(isInsurancePolicyValid(null)).toBe(false)
      })

      it('should return true for future expiry', () => {
        const futureDate = daysFromNow(30)
        expect(isInsurancePolicyValid(futureDate)).toBe(true)
      })

      it('should return false for expired policy', () => {
        const pastDate = daysAgo(10)
        expect(isInsurancePolicyValid(pastDate)).toBe(false)
      })
    })

    describe('formatInsurancePolicyStatus', () => {
      it('should return "none" status for null expiryDate', () => {
        const result = formatInsurancePolicyStatus(null)
        
        expect(result.status).toBe('none')
        expect(result.message).toBe('No cargada')
      })

      it('should return "valid" status for policy with > 30 days', () => {
        const futureDate = daysFromNow(60)
        const result = formatInsurancePolicyStatus(futureDate)
        
        expect(result.status).toBe('valid')
        expect(result.daysRemaining).toBeGreaterThan(30)
      })

      it('should return "expiring" status for policy with <= 30 days', () => {
        const futureDate = daysFromNow(15)
        const result = formatInsurancePolicyStatus(futureDate)
        
        expect(result.status).toBe('expiring')
        expect(result.daysRemaining).toBeLessThanOrEqual(30)
      })

      it('should return "expired" status for past expiry', () => {
        const pastDate = daysAgo(10)
        const result = formatInsurancePolicyStatus(pastDate)
        
        expect(result.status).toBe('expired')
        expect(result.message).toBe('Vencida')
      })
    })
  })

  describe('Tax/Cost Calculation Functions', () => {
    
    describe('calculateProjectedVsPaidPercentage', () => {
      it('should return 0 when projected is 0', () => {
        expect(calculateProjectedVsPaidPercentage(0, 100)).toBe(0)
      })

      it('should return 0 when projected is negative', () => {
        expect(calculateProjectedVsPaidPercentage(-100, 50)).toBe(0)
      })

      it('should return correct percentage', () => {
        expect(calculateProjectedVsPaidPercentage(100, 50)).toBe(50)
        expect(calculateProjectedVsPaidPercentage(200, 50)).toBe(25)
        expect(calculateProjectedVsPaidPercentage(100, 100)).toBe(100)
        expect(calculateProjectedVsPaidPercentage(100, 150)).toBe(150) // Overpaid
      })

      it('should round to nearest integer', () => {
        expect(calculateProjectedVsPaidPercentage(100, 33)).toBe(33)
        expect(calculateProjectedVsPaidPercentage(100, 66)).toBe(66)
        expect(calculateProjectedVsPaidPercentage(3, 1)).toBe(33)
      })
    })

    describe('formatCurrency', () => {
      it('should format currency in Argentine Peso format', () => {
        const result = formatCurrency(1000000)
        
        // Should contain $ and separator formatting
        expect(result).toContain('$')
        // Argentina uses . as thousands separator
        expect(result).toMatch(/\d/)
      })

      it('should format 0 correctly', () => {
        const result = formatCurrency(0)
        expect(result).toContain('$')
      })

      it('should format negative numbers', () => {
        const result = formatCurrency(-5000)
        expect(result).toContain('$')
      })
    })

    describe('calculateRemainingAmount', () => {
      it('should return positive remaining amount', () => {
        expect(calculateRemainingAmount(100, 30)).toBe(70)
        expect(calculateRemainingAmount(1000, 500)).toBe(500)
      })

      it('should return 0 when paid exceeds projected', () => {
        expect(calculateRemainingAmount(100, 150)).toBe(0)
      })

      it('should return 0 when fully paid', () => {
        expect(calculateRemainingAmount(100, 100)).toBe(0)
      })

      it('should return full amount when nothing paid', () => {
        expect(calculateRemainingAmount(1000, 0)).toBe(1000)
      })
    })

    describe('calculateTaxSummary', () => {
      const createMockProject = (overrides: Partial<Project> = {}): Project => ({
        id: 'test-id',
        company_id: 'test-company',
        name: 'Test Project',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        projected_total_cost: 100000,
        paid_total_cost: 30000,
        paid_cost_rubro_a: 10000,
        paid_cost_rubro_b: 15000,
        paid_cost_rubro_c: 5000,
        ...overrides
      })

      it('should calculate correct totals', () => {
        const project = createMockProject()
        const result = calculateTaxSummary(project)
        
        expect(result.projectedTotal).toBe(100000)
        expect(result.paidTotal).toBe(30000)
        expect(result.remainingTotal).toBe(70000)
        expect(result.percentagePaid).toBe(30)
      })

      it('should calculate rubro breakdown percentages', () => {
        const project = createMockProject()
        const result = calculateTaxSummary(project)
        
        // A: 10000/30000 = 33%
        expect(result.rubroBreakdown.A.paid).toBe(10000)
        expect(result.rubroBreakdown.A.percentage).toBe(33)
        
        // B: 15000/30000 = 50%
        expect(result.rubroBreakdown.B.paid).toBe(15000)
        expect(result.rubroBreakdown.B.percentage).toBe(50)
        
        // C: 5000/30000 = 17%
        expect(result.rubroBreakdown.C.paid).toBe(5000)
        expect(result.rubroBreakdown.C.percentage).toBe(17)
      })

      it('should handle project with no costs', () => {
        const project = createMockProject({
          projected_total_cost: undefined,
          paid_total_cost: undefined,
          paid_cost_rubro_a: undefined,
          paid_cost_rubro_b: undefined,
          paid_cost_rubro_c: undefined
        })
        const result = calculateTaxSummary(project)
        
        expect(result.projectedTotal).toBe(0)
        expect(result.paidTotal).toBe(0)
        expect(result.remainingTotal).toBe(0)
        expect(result.percentagePaid).toBe(0)
        expect(result.rubroBreakdown.A.percentage).toBe(0)
        expect(result.rubroBreakdown.B.percentage).toBe(0)
        expect(result.rubroBreakdown.C.percentage).toBe(0)
      })

      it('should handle fully paid project', () => {
        const project = createMockProject({
          projected_total_cost: 50000,
          paid_total_cost: 50000
        })
        const result = calculateTaxSummary(project)
        
        expect(result.remainingTotal).toBe(0)
        expect(result.percentagePaid).toBe(100)
      })
    })
  })

  describe('Inhibition Report Functions', () => {
    
    describe('calculateInhibitionReportDaysRemaining', () => {
      it('should return null for null uploadDate', () => {
        expect(calculateInhibitionReportDaysRemaining(null)).toBeNull()
      })

      it('should return approximately 90 days for today upload', () => {
        const today = new Date().toISOString().split('T')[0]
        const result = calculateInhibitionReportDaysRemaining(today)
        
        expect(result).toBeGreaterThanOrEqual(89)
        expect(result).toBeLessThanOrEqual(91)
      })

      it('should return negative for expired report', () => {
        const oldDate = daysAgo(100)
        const result = calculateInhibitionReportDaysRemaining(oldDate)
        
        // 100 days ago means expired 10 days ago (90 day validity)
        expect(result).toBeLessThan(0)
      })
    })

    describe('isInhibitionReportValid', () => {
      it('should return false for null uploadDate', () => {
        expect(isInhibitionReportValid(null)).toBe(false)
      })

      it('should return true for recent upload', () => {
        const today = new Date().toISOString().split('T')[0]
        expect(isInhibitionReportValid(today)).toBe(true)
      })

      it('should return false for expired report', () => {
        const oldDate = daysAgo(100)
        expect(isInhibitionReportValid(oldDate)).toBe(false)
      })
    })

    describe('formatInhibitionReportStatus', () => {
      it('should return "Pendiente" for null uploadDate', () => {
        const result = formatInhibitionReportStatus(null)
        
        expect(result.status).toBe('Pendiente')
        expect(result.message).toBe('No cargado')
      })

      it('should return "Vigente" for report with > 15 days', () => {
        const recentDate = daysAgo(30) // 60 days remaining
        const result = formatInhibitionReportStatus(recentDate)
        
        expect(result.status).toBe('Vigente')
        expect(result.daysRemaining).toBeGreaterThan(15)
      })

      it('should return "Por vencer" for report with <= 15 days', () => {
        const uploadDate = daysAgo(80) // ~10 days remaining
        const result = formatInhibitionReportStatus(uploadDate)
        
        expect(result.status).toBe('Por vencer')
        expect(result.daysRemaining).toBeLessThanOrEqual(15)
      })

      it('should return "Vencido" for expired report', () => {
        const oldDate = daysAgo(100)
        const result = formatInhibitionReportStatus(oldDate)
        
        expect(result.status).toBe('Vencido')
        expect(result.message).toBe('Vencido')
      })
    })
  })
})
