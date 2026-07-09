import { describe, expect, it } from 'vitest'
import {
  addDays,
  datePart,
  dayDiff,
  formatDayLabel,
  layoverMinutes,
  minutesFromMidnight,
  timePart,
  todayLocalIso,
} from '@/lib/datetime'

describe('wall-clock string helpers', () => {
  it('slices time and date parts without Date round-trips', () => {
    expect(timePart('2026-07-20T14:30:00')).toBe('14:30')
    expect(datePart('2026-07-20T14:30:00')).toBe('2026-07-20')
    expect(minutesFromMidnight('2026-07-20T14:30:00')).toBe(870)
  })
})

describe('dayDiff', () => {
  it('is zero for a same-day arrival', () => {
    expect(dayDiff('2026-07-20T14:30:00', '2026-07-20T22:45:00')).toBe(0)
  })

  it('counts overnight arrivals across month boundaries', () => {
    expect(dayDiff('2026-07-31T23:30:00', '2026-08-01T06:15:00')).toBe(1)
  })
})

describe('layoverMinutes', () => {
  it('diffs two local stamps at the same airport', () => {
    expect(layoverMinutes('2026-07-20T14:30:00', '2026-07-20T16:45:00')).toBe(135)
  })

  it('tolerates stamps that already carry a zone', () => {
    expect(layoverMinutes('2026-07-20T14:30:00Z', '2026-07-20T15:30:00Z')).toBe(60)
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('is a no-op for zero', () => {
    expect(addDays('2026-07-20', 0)).toBe('2026-07-20')
  })
})

describe('labels and today', () => {
  it('formats a day chip label', () => {
    expect(formatDayLabel('2026-07-22')).toBe('Wed 22 Jul')
  })

  it('produces an ISO date for today', () => {
    expect(todayLocalIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
