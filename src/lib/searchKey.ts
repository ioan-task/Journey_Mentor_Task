import type { SearchParams } from '@/types/domain'
import { addDays, todayLocalIso } from '@/lib/datetime'

export function searchCacheKey(params: SearchParams): string {
  return [
    params.origin?.iataCode ?? '',
    params.destination?.iataCode ?? '',
    params.returnDate ?? '',
    params.passengers,
    params.cabinClass,
  ].join('|')
}

export function historyKey(params: SearchParams): string {
  return `${searchCacheKey(params)}|${params.departureDate}`
}

export function cloneSearchParams(source: SearchParams): SearchParams {
  return {
    ...source,
    origin: source.origin ? { ...source.origin } : null,
    destination: source.destination ? { ...source.destination } : null,
  }
}

export function defaultSearchParams(): SearchParams {
  return {
    origin: null,
    destination: null,
    departureDate: addDays(todayLocalIso(), 7),
    returnDate: null,
    passengers: 1,
    cabinClass: 'economy',
  }
}
