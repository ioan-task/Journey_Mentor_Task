import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SearchParams } from '@/types/domain'
import {
  loadHistory,
  loadLastSearch,
  saveHistory,
  saveLastSearch,
  type PersistedSearchState,
} from '@/lib/persistence'
import { defaultFilters } from '@/lib/offersView'
import { makeOffer } from '../helpers/makeOffer'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

const params: SearchParams = {
  origin: { iataCode: 'LHR', name: 'Heathrow', cityName: 'London', type: 'airport' },
  destination: { iataCode: 'JFK', name: 'John F. Kennedy', cityName: 'New York', type: 'airport' },
  departureDate: '2026-07-20',
  returnDate: null,
  passengers: 2,
  cabinClass: 'economy',
}

function makeState(overrides: Partial<PersistedSearchState> = {}): PersistedSearchState {
  return {
    params,
    activeDate: '2026-07-20',
    filters: defaultFilters(),
    sort: 'price',
    entries: {
      '2026-07-20': { offers: [makeOffer()], fetchedAt: 1000, cheapestAmount: 400 },
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('last search persistence', () => {
  it('round-trips the full state', () => {
    saveLastSearch(makeState())
    const loaded = loadLastSearch()
    expect(loaded).not.toBeNull()
    expect(loaded!.params.origin?.iataCode).toBe('LHR')
    expect(loaded!.entries['2026-07-20']!.offers).toHaveLength(1)
    expect(loaded!.sort).toBe('price')
  })

  it('returns null and removes the key for corrupt JSON', () => {
    localStorage.setItem('fs:v1:lastSearch', '{not json')
    expect(loadLastSearch()).toBeNull()
    expect(localStorage.getItem('fs:v1:lastSearch')).toBeNull()
  })

  it('rejects structurally invalid data and removes the key', () => {
    localStorage.setItem('fs:v1:lastSearch', JSON.stringify({ params: { nope: true } }))
    expect(loadLastSearch()).toBeNull()
    expect(localStorage.getItem('fs:v1:lastSearch')).toBeNull()
  })

  it('caps persisted entries at 9 dates keeping the newest', () => {
    const entries: PersistedSearchState['entries'] = {}
    for (let day = 1; day <= 12; day++) {
      const date = `2026-07-${String(day).padStart(2, '0')}`
      entries[date] = { offers: [makeOffer()], fetchedAt: day, cheapestAmount: 100 }
    }
    saveLastSearch(makeState({ entries }))
    const loaded = loadLastSearch()
    const dates = Object.keys(loaded!.entries)
    expect(dates).toHaveLength(9)
    expect(dates).not.toContain('2026-07-01')
    expect(dates).toContain('2026-07-12')
  })

  it('caps offers per date at 50 keeping the cheapest', () => {
    const offers = Array.from({ length: 60 }, (_, index) =>
      makeOffer({ id: `off_${index}`, totalAmount: 1000 - index }),
    )
    saveLastSearch(
      makeState({ entries: { '2026-07-20': { offers, fetchedAt: 1, cheapestAmount: 941 } } }),
    )
    const loaded = loadLastSearch()
    const persisted = loaded!.entries['2026-07-20']!.offers
    expect(persisted).toHaveLength(50)
    expect(Math.max(...persisted.map((offer) => offer.totalAmount))).toBe(990)
  })

  it('falls back to params-only persistence when the quota is exceeded', () => {
    const storage = new MemoryStorage()
    let calls = 0
    const originalSet = storage.setItem.bind(storage)
    storage.setItem = (key, value) => {
      calls++
      if (calls === 1) throw new DOMException('quota', 'QuotaExceededError')
      originalSet(key, value)
    }
    vi.stubGlobal('localStorage', storage)

    saveLastSearch(makeState())
    const loaded = loadLastSearch()
    expect(loaded).not.toBeNull()
    expect(loaded!.params.origin?.iataCode).toBe('LHR')
    expect(loaded!.entries).toEqual({})
  })
})

describe('history persistence', () => {
  it('round-trips history entries', () => {
    saveHistory([{ params, savedAt: 123 }])
    expect(loadHistory()).toEqual([{ params, savedAt: 123 }])
  })

  it('filters out invalid entries', () => {
    localStorage.setItem('fs:v1:history', JSON.stringify([{ params, savedAt: 1 }, { junk: true }]))
    expect(loadHistory()).toHaveLength(1)
  })

  it('returns an empty list when the value is not an array', () => {
    localStorage.setItem('fs:v1:history', JSON.stringify({ nope: true }))
    expect(loadHistory()).toEqual([])
  })
})
