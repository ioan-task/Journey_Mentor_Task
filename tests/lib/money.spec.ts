import { describe, expect, it } from 'vitest'
import { formatMoney, formatMoneyRounded } from '@/lib/money'

describe('formatMoney', () => {
  it('formats with the currency symbol and decimals', () => {
    expect(formatMoney(412.5, 'EUR')).toBe('€412.50')
  })

  it('respects zero-decimal currencies', () => {
    expect(formatMoney(12000, 'JPY')).toBe('¥12,000')
  })

  it('falls back gracefully for unknown currency codes', () => {
    expect(formatMoney(99.99, 'NOPE!')).toBe('99.99 NOPE!')
  })
})

describe('formatMoneyRounded', () => {
  it('rounds to whole units for compact spots', () => {
    expect(formatMoneyRounded(412.53, 'EUR')).toBe('€413')
  })
})
