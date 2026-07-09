import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { DateWindowEntry, OfferFilters, SearchParams, SortKey } from '@/types/domain'
import { searchOffers } from '@/api/duffel/offers'
import { ApiError, isAbortError } from '@/api/http'
import { todayLocalIso } from '@/lib/datetime'
import {
  airlinesIn,
  applyFilters,
  countActiveFilters,
  defaultFilters,
  priceBounds,
  sortOffers,
} from '@/lib/offersView'
import { loadLastSearch, saveLastSearch, type PersistedEntry } from '@/lib/persistence'
import { cloneSearchParams, defaultSearchParams, searchCacheKey } from '@/lib/searchKey'
import { useHistoryStore } from '@/stores/historyStore'

const FRESHNESS_TTL_MS = 15 * 60 * 1000
const MAX_CACHED_DATES = 9
const SAVE_DEBOUNCE_MS = 500

export const useSearchStore = defineStore('search', () => {
  const params = ref<SearchParams>(defaultSearchParams())
  const committed = ref<SearchParams | null>(null)
  const activeDate = ref<string | null>(null)
  const cache = ref(new Map<string, DateWindowEntry>())
  const filters = ref<OfferFilters>(defaultFilters())
  const sort = ref<SortKey>('price')
  const now = ref(Date.now())

  let generation = 0
  const controllers = new Map<string, AbortController>()

  const historyStore = useHistoryStore()

  const hasSearched = computed(() => committed.value !== null)
  const activeEntry = computed(() =>
    activeDate.value ? (cache.value.get(activeDate.value) ?? null) : null,
  )
  const rawOffers = computed(() => activeEntry.value?.offers ?? [])
  const filteredOffers = computed(() => applyFilters(rawOffers.value, filters.value))
  const visibleOffers = computed(() => sortOffers(filteredOffers.value, sort.value))
  const isFilteredEmpty = computed(
    () => rawOffers.value.length > 0 && filteredOffers.value.length === 0,
  )
  const currentPriceBounds = computed(() => priceBounds(rawOffers.value))
  const availableAirlines = computed(() => airlinesIn(rawOffers.value))
  const activeFilterCount = computed(() => countActiveFilters(filters.value))

  const activeOffersExpired = computed(() => {
    const entry = activeEntry.value
    if (!entry || entry.status !== 'success') return false
    const expiries = entry.offers
      .map((offer) => Date.parse(offer.expiresAt))
      .filter((stamp) => Number.isFinite(stamp))
    return expiries.length > 0 && Math.min(...expiries) < now.value
  })

  function submit(): void {
    const snapshot = cloneSearchParams(params.value)
    const nextKey = searchCacheKey(snapshot)
    const currentKey = committed.value ? searchCacheKey(committed.value) : null
    if (nextKey !== currentKey) {
      generation++
      abortAll()
      cache.value.clear()
      filters.value = defaultFilters()
    }
    committed.value = snapshot
    historyStore.record(snapshot)
    activateDate(snapshot.departureDate)
  }

  function applySearch(saved: SearchParams): void {
    const next = cloneSearchParams(saved)
    const today = todayLocalIso()
    if (next.departureDate < today) next.departureDate = today
    if (next.returnDate !== null && next.returnDate < next.departureDate) next.returnDate = null
    params.value = next
    submit()
  }

  function activateDate(date: string): void {
    activeDate.value = date
    params.value.departureDate = date
    if (committed.value) committed.value = { ...committed.value, departureDate: date }

    const entry = cache.value.get(date)
    if (entry) {
      const fresh = entry.fetchedAt > 0 && Date.now() - entry.fetchedAt < FRESHNESS_TTL_MS
      if (entry.status === 'loading') return
      if (fresh && entry.status !== 'error') return
    }
    void fetchDate(date)
  }

  function refreshActiveDate(): void {
    if (activeDate.value) void fetchDate(activeDate.value)
  }

  async function fetchDate(date: string): Promise<void> {
    if (!committed.value) return

    controllers.get(date)?.abort()
    const controller = new AbortController()
    controllers.set(date, controller)
    const gen = generation

    cache.value.set(date, {
      status: 'loading',
      offers: [],
      fetchedAt: 0,
      cheapestAmount: null,
      error: null,
    })

    try {
      const offers = await searchOffers(committed.value, date, controller.signal)
      if (gen !== generation || controller.signal.aborted) return
      cache.value.set(date, {
        status: offers.length === 0 ? 'empty' : 'success',
        offers,
        fetchedAt: Date.now(),
        cheapestAmount: offers.length
          ? Math.min(...offers.map((offer) => offer.totalAmount))
          : null,
        error: null,
      })
      pruneCache()
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted || gen !== generation) return
      cache.value.set(date, {
        status: 'error',
        offers: [],
        fetchedAt: 0,
        cheapestAmount: null,
        error:
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      })
    } finally {
      if (controllers.get(date) === controller) controllers.delete(date)
    }
  }

  function abortAll(): void {
    for (const controller of controllers.values()) controller.abort()
    controllers.clear()
  }

  function pruneCache(): void {
    if (cache.value.size <= MAX_CACHED_DATES) return
    const evictable = [...cache.value.entries()]
      .filter(([date, entry]) => date !== activeDate.value && entry.fetchedAt > 0)
      .sort(([, a], [, b]) => a.fetchedAt - b.fetchedAt)
    for (const [date] of evictable.slice(0, cache.value.size - MAX_CACHED_DATES)) {
      cache.value.delete(date)
    }
  }

  function resetFilters(): void {
    filters.value = defaultFilters()
  }

  function hydrate(): void {
    const saved = loadLastSearch()
    if (!saved) return
    params.value = saved.params
    committed.value = cloneSearchParams(saved.params)
    activeDate.value = saved.activeDate
    filters.value = saved.filters
    sort.value = saved.sort
    for (const [date, entry] of Object.entries(saved.entries)) {
      cache.value.set(date, {
        status: entry.offers.length === 0 ? 'empty' : 'success',
        offers: entry.offers,
        fetchedAt: entry.fetchedAt,
        cheapestAmount: entry.cheapestAmount,
        error: null,
      })
    }
    if (activeDate.value && !cache.value.has(activeDate.value)) {
      void fetchDate(activeDate.value)
    }
  }

  function persistNow(): void {
    if (!committed.value) return
    const entries: Record<string, PersistedEntry> = {}
    for (const [date, entry] of cache.value) {
      if (entry.status === 'success' || entry.status === 'empty') {
        entries[date] = {
          offers: entry.offers,
          fetchedAt: entry.fetchedAt,
          cheapestAmount: entry.cheapestAmount,
        }
      }
    }
    saveLastSearch({
      params: committed.value,
      activeDate: activeDate.value,
      filters: filters.value,
      sort: sort.value,
      entries,
    })
  }

  let saveTimer: ReturnType<typeof setTimeout> | undefined
  watch(
    [committed, activeDate, filters, sort, cache],
    () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(persistNow, SAVE_DEBOUNCE_MS)
    },
    { deep: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', persistNow)
    setInterval(() => {
      now.value = Date.now()
    }, 60_000)
  }

  return {
    params,
    committed,
    activeDate,
    cache,
    filters,
    sort,
    hasSearched,
    activeEntry,
    rawOffers,
    filteredOffers,
    visibleOffers,
    isFilteredEmpty,
    currentPriceBounds,
    availableAirlines,
    activeFilterCount,
    activeOffersExpired,
    submit,
    applySearch,
    activateDate,
    refreshActiveDate,
    resetFilters,
    hydrate,
  }
})
