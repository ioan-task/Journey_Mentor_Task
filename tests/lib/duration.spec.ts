import { describe, expect, it } from 'vitest'
import { formatMinutes, parseIsoDurationMinutes } from '@/lib/duration'

describe('parseIsoDurationMinutes', () => {
  it('parses hour + minute durations', () => {
    expect(parseIsoDurationMinutes('PT2H26M')).toBe(146)
  })

  it('parses minute-only and hour-only durations', () => {
    expect(parseIsoDurationMinutes('PT45M')).toBe(45)
    expect(parseIsoDurationMinutes('PT3H')).toBe(180)
  })

  it('parses durations with days', () => {
    expect(parseIsoDurationMinutes('P1DT2H')).toBe(1560)
    expect(parseIsoDurationMinutes('P2D')).toBe(2880)
  })

  it('rounds seconds into minutes', () => {
    expect(parseIsoDurationMinutes('PT1H30M45S')).toBe(91)
  })

  it('returns null for unparseable input', () => {
    expect(parseIsoDurationMinutes('nonsense')).toBeNull()
    expect(parseIsoDurationMinutes('P')).toBeNull()
    expect(parseIsoDurationMinutes('PT')).toBeNull()
    expect(parseIsoDurationMinutes('')).toBeNull()
    expect(parseIsoDurationMinutes(null)).toBeNull()
    expect(parseIsoDurationMinutes(undefined)).toBeNull()
  })
})

describe('formatMinutes', () => {
  it('formats hours and minutes', () => {
    expect(formatMinutes(146)).toBe('2h 26m')
  })

  it('omits the zero part', () => {
    expect(formatMinutes(45)).toBe('45m')
    expect(formatMinutes(180)).toBe('3h')
  })

  it('falls back to an em dash for unknown values', () => {
    expect(formatMinutes(null)).toBe('—')
    expect(formatMinutes(undefined)).toBe('—')
    expect(formatMinutes(-5)).toBe('—')
  })

  it('never renders 60 minutes for fractional input near an hour boundary', () => {
    expect(formatMinutes(119.7)).toBe('2h')
    expect(formatMinutes(59.6)).toBe('1h')
  })
})
