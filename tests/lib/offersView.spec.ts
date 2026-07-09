import { describe, expect, it } from 'vitest'
import {
  airlinesIn,
  applyFilters,
  countActiveFilters,
  defaultFilters,
  priceBounds,
  sortOffers,
  stopsBucketOf,
  totalDurationMinutes,
} from '@/lib/offersView'
import { makeOffer, makeSlice } from '../helpers/makeOffer'

const nonstop = makeOffer({
  id: 'nonstop',
  totalAmount: 500,
  slices: [makeSlice({ stops: 0, durationMinutes: 460, departingAt: '2026-07-20T08:00:00' })],
})
const oneStop = makeOffer({
  id: 'one-stop',
  totalAmount: 300,
  slices: [makeSlice({ stops: 1, durationMinutes: 600, departingAt: '2026-07-20T14:00:00' })],
})
const threeStops = makeOffer({
  id: 'three-stops',
  totalAmount: 150,
  airline: { name: 'Other Air', iataCode: 'OA', logoUrl: null },
  slices: [makeSlice({ stops: 3, durationMinutes: 900, departingAt: '2026-07-20T22:30:00' })],
})
const all = [nonstop, oneStop, threeStops]

describe('stopsBucketOf', () => {
  it('uses the worst slice and clamps to the 2+ bucket', () => {
    expect(stopsBucketOf(nonstop)).toBe(0)
    expect(stopsBucketOf(oneStop)).toBe(1)
    expect(stopsBucketOf(threeStops)).toBe(2)
    expect(
      stopsBucketOf(makeOffer({ slices: [makeSlice({ stops: 0 }), makeSlice({ stops: 1 })] })),
    ).toBe(1)
  })
})

describe('applyFilters', () => {
  it('passes everything through with default filters', () => {
    expect(applyFilters(all, defaultFilters())).toHaveLength(3)
  })

  it('filters by stops buckets, including 2+ for any higher count', () => {
    const filters = { ...defaultFilters(), stops: [0 as const, 2 as const] }
    expect(applyFilters(all, filters).map((offer) => offer.id)).toEqual(['nonstop', 'three-stops'])
  })

  it('filters by price range', () => {
    const filters = { ...defaultFilters(), priceMin: 200, priceMax: 400 }
    expect(applyFilters(all, filters).map((offer) => offer.id)).toEqual(['one-stop'])
  })

  it('filters by outbound departure-time window', () => {
    const filters = { ...defaultFilters(), departureFrom: 9 * 60, departureTo: 21 * 60 }
    expect(applyFilters(all, filters).map((offer) => offer.id)).toEqual(['one-stop'])
  })

  it('filters by airline', () => {
    const filters = { ...defaultFilters(), airlines: ['OA'] }
    expect(applyFilters(all, filters).map((offer) => offer.id)).toEqual(['three-stops'])
  })
})

describe('sortOffers', () => {
  it('sorts by price ascending without mutating the input', () => {
    const sorted = sortOffers(all, 'price')
    expect(sorted.map((offer) => offer.id)).toEqual(['three-stops', 'one-stop', 'nonstop'])
    expect(all.map((offer) => offer.id)).toEqual(['nonstop', 'one-stop', 'three-stops'])
  })

  it('sorts by total duration with unknown durations last', () => {
    const unknown = makeOffer({ id: 'unknown', slices: [makeSlice({ durationMinutes: null })] })
    const sorted = sortOffers([unknown, ...all], 'duration')
    expect(sorted.map((offer) => offer.id)).toEqual([
      'nonstop',
      'one-stop',
      'three-stops',
      'unknown',
    ])
  })

  it('sorts by outbound departure time', () => {
    const sorted = sortOffers(all, 'departure')
    expect(sorted.map((offer) => offer.id)).toEqual(['nonstop', 'one-stop', 'three-stops'])
  })
})

describe('totalDurationMinutes', () => {
  it('sums slice durations and returns null when any is unknown', () => {
    const roundTrip = makeOffer({
      slices: [makeSlice({ durationMinutes: 400 }), makeSlice({ durationMinutes: 420 })],
    })
    expect(totalDurationMinutes(roundTrip)).toBe(820)
    expect(
      totalDurationMinutes(makeOffer({ slices: [makeSlice({ durationMinutes: null })] })),
    ).toBeNull()
  })
})

describe('priceBounds and airlinesIn', () => {
  it('returns floored/ceiled bounds and null for no offers', () => {
    expect(priceBounds(all)).toEqual({ min: 150, max: 500 })
    expect(priceBounds([])).toBeNull()
  })

  it('collects unique airlines sorted by name', () => {
    expect(airlinesIn(all)).toEqual([
      { iataCode: 'ZZ', name: 'Duffel Airways' },
      { iataCode: 'OA', name: 'Other Air' },
    ])
  })
})

describe('countActiveFilters', () => {
  it('counts each active filter group once', () => {
    expect(countActiveFilters(defaultFilters())).toBe(0)
    expect(
      countActiveFilters({
        stops: [0],
        priceMin: 100,
        priceMax: null,
        departureFrom: null,
        departureTo: 18 * 60,
        airlines: ['ZZ'],
      }),
    ).toBe(4)
  })
})
