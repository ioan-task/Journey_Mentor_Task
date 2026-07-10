import type {
  CabinClass,
  Offer,
  OfferFilters,
  PlaceRef,
  SearchHistoryEntry,
  SearchParams,
  SortKey,
  StopsBucket,
} from '@/types/domain'

const LAST_SEARCH_KEY = 'fs:v1:lastSearch'
const HISTORY_KEY = 'fs:v1:history'

const MAX_PERSISTED_DATES = 9
const MAX_OFFERS_PER_DATE = 50

export interface PersistedEntry {
  offers: Offer[]
  fetchedAt: number
  cheapestAmount: number | null
}

export interface PersistedSearchState {
  params: SearchParams
  activeDate: string | null
  filters: OfferFilters
  sort: SortKey
  entries: Record<string, PersistedEntry>
}


function readJson(key: string): unknown {
  let raw: string | null
  try {
    raw = localStorage.getItem(key)
  } catch {
    return null
  }
  if (raw === null) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    remove(key)
    return null
  }
}

function writeJson(key: string, value: unknown, quotaFallback?: () => unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    if (!quotaFallback) return
    try {
      localStorage.setItem(key, JSON.stringify(quotaFallback()))
    } catch {
      // Storage unavailable (private mode, disabled) — persistence is best-effort.
    }
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore — storage unavailable.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString = (value: unknown): value is string => typeof value === 'string'
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const CABIN_CLASSES: readonly CabinClass[] = ['economy', 'premium_economy', 'business', 'first']
const SORT_KEYS: readonly SortKey[] = ['price', 'duration', 'departure']
const STOPS_BUCKETS: readonly StopsBucket[] = [0, 1, 2]

function isPlaceRef(value: unknown): value is PlaceRef {
  return (
    isRecord(value) &&
    isString(value.iataCode) &&
    isString(value.name) &&
    (value.cityName === null || isString(value.cityName)) &&
    (value.type === 'airport' || value.type === 'city')
  )
}

function isSearchParams(value: unknown): value is SearchParams {
  return (
    isRecord(value) &&
    (value.origin === null || isPlaceRef(value.origin)) &&
    (value.destination === null || isPlaceRef(value.destination)) &&
    isString(value.departureDate) &&
    (value.returnDate === null || isString(value.returnDate)) &&
    isFiniteNumber(value.passengers) &&
    CABIN_CLASSES.includes(value.cabinClass as CabinClass)
  )
}

function isFilters(value: unknown): value is OfferFilters {
  return (
    isRecord(value) &&
    Array.isArray(value.stops) &&
    value.stops.every((stop) => STOPS_BUCKETS.includes(stop as StopsBucket)) &&
    (value.priceMin === null || isFiniteNumber(value.priceMin)) &&
    (value.priceMax === null || isFiniteNumber(value.priceMax)) &&
    (value.departureFrom === null || isFiniteNumber(value.departureFrom)) &&
    (value.departureTo === null || isFiniteNumber(value.departureTo)) &&
    Array.isArray(value.airlines) &&
    value.airlines.every(isString)
  )
}

function isOffer(value: unknown): value is Offer {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isFiniteNumber(value.totalAmount) &&
    isString(value.currency) &&
    isString(value.expiresAt) &&
    isRecord(value.airline) &&
    Array.isArray(value.slices) &&
    value.slices.length > 0 &&
    value.slices.every(
      (slice) => isRecord(slice) && isString(slice.departingAt) && Array.isArray(slice.segments),
    )
  )
}

function isPersistedEntry(value: unknown): value is PersistedEntry {
  return (
    isRecord(value) &&
    Array.isArray(value.offers) &&
    value.offers.every(isOffer) &&
    isFiniteNumber(value.fetchedAt) &&
    (value.cheapestAmount === null || isFiniteNumber(value.cheapestAmount))
  )
}

function isPersistedSearchState(value: unknown): value is PersistedSearchState {
  return (
    isRecord(value) &&
    isSearchParams(value.params) &&
    (value.activeDate === null || isString(value.activeDate)) &&
    isFilters(value.filters) &&
    SORT_KEYS.includes(value.sort as SortKey) &&
    isRecord(value.entries) &&
    Object.values(value.entries).every(isPersistedEntry)
  )
}

function isHistoryEntry(value: unknown): value is SearchHistoryEntry {
  return isRecord(value) && isSearchParams(value.params) && isFiniteNumber(value.savedAt)
}

function trimEntries(entries: Record<string, PersistedEntry>): Record<string, PersistedEntry> {
  const newestFirst = Object.entries(entries).sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
  const trimmed: Record<string, PersistedEntry> = {}
  for (const [date, entry] of newestFirst.slice(0, MAX_PERSISTED_DATES)) {
    trimmed[date] = {
      ...entry,
      offers: [...entry.offers]
        .sort((a, b) => a.totalAmount - b.totalAmount)
        .slice(0, MAX_OFFERS_PER_DATE),
    }
  }
  return trimmed
}

export function saveLastSearch(state: PersistedSearchState): void {
  const slim: PersistedSearchState = { ...state, entries: trimEntries(state.entries) }
  writeJson(LAST_SEARCH_KEY, slim, () => ({ ...slim, entries: {} }))
}

export function loadLastSearch(): PersistedSearchState | null {
  const parsed = readJson(LAST_SEARCH_KEY)
  if (parsed === null) return null
  if (!isPersistedSearchState(parsed)) {
    remove(LAST_SEARCH_KEY)
    return null
  }
  return parsed
}

export function saveHistory(entries: SearchHistoryEntry[]): void {
  writeJson(HISTORY_KEY, entries)
}

export function loadHistory(): SearchHistoryEntry[] {
  const parsed = readJson(HISTORY_KEY)
  if (!Array.isArray(parsed)) {
    if (parsed !== null) remove(HISTORY_KEY)
    return []
  }
  return parsed.filter(isHistoryEntry)
}
