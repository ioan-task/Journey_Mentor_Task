import { describe, expect, it } from 'vitest'
import type { SearchParams } from '@/types/domain'
import { cloneSearchParams, historyKey, searchCacheKey } from '@/lib/searchKey'

const base: SearchParams = {
  origin: { iataCode: 'LHR', name: 'Heathrow', cityName: 'London', type: 'airport' },
  destination: { iataCode: 'JFK', name: 'John F. Kennedy', cityName: 'New York', type: 'airport' },
  departureDate: '2026-07-20',
  returnDate: null,
  passengers: 1,
  cabinClass: 'economy',
}

describe('searchCacheKey', () => {
  it('ignores the departure date so the date window shares one cache', () => {
    expect(searchCacheKey(base)).toBe(searchCacheKey({ ...base, departureDate: '2026-07-25' }))
  })

  it('changes when any other parameter changes', () => {
    const key = searchCacheKey(base)
    expect(searchCacheKey({ ...base, passengers: 2 })).not.toBe(key)
    expect(searchCacheKey({ ...base, cabinClass: 'business' })).not.toBe(key)
    expect(searchCacheKey({ ...base, returnDate: '2026-07-28' })).not.toBe(key)
    expect(
      searchCacheKey({
        ...base,
        destination: {
          iataCode: 'CDG',
          name: 'Charles de Gaulle',
          cityName: 'Paris',
          type: 'airport',
        },
      }),
    ).not.toBe(key)
  })
})

describe('historyKey', () => {
  it('additionally distinguishes departure dates', () => {
    expect(historyKey(base)).not.toBe(historyKey({ ...base, departureDate: '2026-07-25' }))
  })
})

describe('cloneSearchParams', () => {
  it('copies the nested PlaceRefs so mutations do not leak', () => {
    const clone = cloneSearchParams(base)
    expect(clone).toEqual(base)
    expect(clone.origin).not.toBe(base.origin)
    clone.origin!.iataCode = 'AMS'
    expect(base.origin!.iataCode).toBe('LHR')
  })
})
