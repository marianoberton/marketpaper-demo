import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatTime,
  formatM2,
  formatCurrencyPerM2,
} from '../formatters'

describe('Formatters Module', () => {
  describe('formatCurrency', () => {
    it('should format positive integers as Argentinian pesos', () => {
      const result = formatCurrency(1000)
      // Should contain ARS symbol and formatted number
      expect(result).toContain('1.000')
      expect(result).toContain('$')
    })

    it('should format large numbers with thousand separators', () => {
      const result = formatCurrency(1234567)
      expect(result).toContain('1.234.567')
    })

    it('should format zero', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
    })

    it('should format negative values', () => {
      const result = formatCurrency(-5000)
      expect(result).toContain('5.000')
      // Negative should be indicated somehow
      expect(result.includes('-') || result.includes('(') || result.includes('−')).toBe(true)
    })

    it('should round decimals (maximumFractionDigits: 0)', () => {
      const result = formatCurrency(1234.56)
      // Should not contain decimal point
      expect(result).not.toMatch(/,\d{2}$/) // No cents
      expect(result).toContain('1.235') // Rounded up
    })

    it('should handle very large numbers', () => {
      const result = formatCurrency(999999999)
      expect(result).toContain('999.999.999')
    })
  })

  describe('formatPercent', () => {
    it('should format integer percentages', () => {
      expect(formatPercent(50)).toBe('50.0%')
    })

    it('should format decimal percentages with 1 decimal place', () => {
      expect(formatPercent(33.333)).toBe('33.3%')
    })

    it('should format zero', () => {
      expect(formatPercent(0)).toBe('0.0%')
    })

    it('should format 100%', () => {
      expect(formatPercent(100)).toBe('100.0%')
    })

    it('should format values over 100%', () => {
      expect(formatPercent(150)).toBe('150.0%')
    })

    it('should format negative percentages', () => {
      expect(formatPercent(-25.5)).toBe('-25.5%')
    })

    it('should round to one decimal place', () => {
      expect(formatPercent(33.3333)).toBe('33.3%')
      expect(formatPercent(66.6666)).toBe('66.7%')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers less than 1000 as-is', () => {
      expect(formatNumber(500)).toBe('500')
      expect(formatNumber(999)).toBe('999')
    })

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(5000)).toBe('5.0K')
      expect(formatNumber(15500)).toBe('15.5K')
    })

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M')
      expect(formatNumber(5500000)).toBe('5.5M')
      expect(formatNumber(12345678)).toBe('12.3M')
    })

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle edge cases near thresholds', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(1000)).toBe('1.0K')
      expect(formatNumber(999999)).toBe('1000.0K')
      expect(formatNumber(1000000)).toBe('1.0M')
    })

    it('should round to one decimal place', () => {
      expect(formatNumber(1234)).toBe('1.2K')
      expect(formatNumber(1250)).toBe('1.3K') // Rounds up from 1.25
    })
  })

  describe('formatTime', () => {
    it('should format seconds as mm:ss', () => {
      expect(formatTime(0)).toBe('0:00')
      expect(formatTime(30)).toBe('0:30')
      expect(formatTime(60)).toBe('1:00')
      expect(formatTime(90)).toBe('1:30')
    })

    it('should pad seconds with leading zero', () => {
      expect(formatTime(65)).toBe('1:05')
      expect(formatTime(61)).toBe('1:01')
    })

    it('should handle large minute values', () => {
      expect(formatTime(3600)).toBe('60:00')
      expect(formatTime(3661)).toBe('61:01')
    })

    it('should floor fractional seconds', () => {
      expect(formatTime(90.5)).toBe('1:30')
      expect(formatTime(90.9)).toBe('1:30')
    })

    it('should handle negative values (edge case)', () => {
      // Behavior depends on implementation, but should not crash
      const result = formatTime(-30)
      expect(typeof result).toBe('string')
    })
  })

  describe('formatM2', () => {
    it('should format square meters with m² symbol', () => {
      const result = formatM2(100)
      expect(result).toContain('100')
      expect(result).toContain('m²')
    })

    it('should format large areas with thousand separators', () => {
      const result = formatM2(1500)
      expect(result).toContain('1.500')
      expect(result).toContain('m²')
    })

    it('should handle decimal values', () => {
      const result = formatM2(123.45)
      expect(result).toContain('123')
      expect(result).toContain('m²')
    })

    it('should format zero', () => {
      const result = formatM2(0)
      expect(result).toContain('0')
      expect(result).toContain('m²')
    })

    it('should round to one decimal place', () => {
      const result = formatM2(123.456)
      // Should be rounded to 123.5 or 123,5 depending on locale
      expect(result).toMatch(/123[,.]5/)
    })
  })

  describe('formatCurrencyPerM2', () => {
    it('should format currency with /m² suffix', () => {
      const result = formatCurrencyPerM2(5000)
      expect(result).toContain('5.000')
      expect(result).toContain('$')
      expect(result).toContain('/m²')
    })

    it('should handle large values', () => {
      const result = formatCurrencyPerM2(150000)
      expect(result).toContain('150.000')
      expect(result).toContain('/m²')
    })

    it('should handle zero', () => {
      const result = formatCurrencyPerM2(0)
      expect(result).toContain('0')
      expect(result).toContain('/m²')
    })

    it('should combine formatCurrency output with /m²', () => {
      const currencyResult = formatCurrency(10000)
      const perM2Result = formatCurrencyPerM2(10000)

      // The perM2 result should be the currency result + /m²
      expect(perM2Result).toBe(`${currencyResult}/m²`)
    })
  })
})
