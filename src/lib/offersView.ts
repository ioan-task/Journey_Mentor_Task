import type { Offer, OfferFilters, SortKey, StopsBucket } from '@/types/domain'
import { minutesFromMidnight } from '@/lib/datetime'

export function stopsBucketOf(offer: Offer): StopsBucket {
  const worst = Math.max(0, ...offer.slices.map((slice) => slice.stops))
  return Math.min(worst, 2) as StopsBucket
}

export function totalDurationMinutes(offer: Offer): number | null {
  let total = 0
  for (const slice of offer.slices) {
    if (slice.durationMinutes == null) return null
    total += slice.durationMinutes
  }
  return total
}

function outboundDeparture(offer: Offer): string {
  return offer.slices[0]?.departingAt ?? ''
}

export function defaultFilters(): OfferFilters {
  return {
    stops: [],
    priceMin: null,
    priceMax: null,
    departureFrom: null,
    departureTo: null,
    airlines: [],
  }
}

export function countActiveFilters(filters: OfferFilters): number {
  let count = 0
  if (filters.stops.length > 0) count++
  if (filters.priceMin != null || filters.priceMax != null) count++
  if (filters.departureFrom != null || filters.departureTo != null) count++
  if (filters.airlines.length > 0) count++
  return count
}

export function applyFilters(offers: Offer[], filters: OfferFilters): Offer[] {
  return offers.filter((offer) => {
    if (filters.stops.length > 0 && !filters.stops.includes(stopsBucketOf(offer))) return false
    if (filters.priceMin != null && offer.totalAmount < filters.priceMin) return false
    if (filters.priceMax != null && offer.totalAmount > filters.priceMax) return false
    if (filters.departureFrom != null || filters.departureTo != null) {
      const departure = outboundDeparture(offer)
      if (!departure) return false
      const minutes = minutesFromMidnight(departure)
      if (filters.departureFrom != null && minutes < filters.departureFrom) return false
      if (filters.departureTo != null && minutes > filters.departureTo) return false
    }
    if (filters.airlines.length > 0) {
      if (!offer.airline.iataCode || !filters.airlines.includes(offer.airline.iataCode)) {
        return false
      }
    }
    return true
  })
}

export function sortOffers(offers: Offer[], sort: SortKey): Offer[] {
  const sorted = [...offers]
  switch (sort) {
    case 'price':
      sorted.sort((a, b) => a.totalAmount - b.totalAmount)
      break
    case 'duration':
      sorted.sort((a, b) => {
        const durationA = totalDurationMinutes(a)
        const durationB = totalDurationMinutes(b)
        if (durationA == null) return durationB == null ? 0 : 1
        if (durationB == null) return -1
        return durationA - durationB
      })
      break
    case 'departure':
      sorted.sort((a, b) => outboundDeparture(a).localeCompare(outboundDeparture(b)))
      break
  }
  return sorted
}

export function priceBounds(offers: Offer[]): { min: number; max: number } | null {
  if (offers.length === 0) return null
  let min = Infinity
  let max = -Infinity
  for (const offer of offers) {
    if (offer.totalAmount < min) min = offer.totalAmount
    if (offer.totalAmount > max) max = offer.totalAmount
  }
  return { min: Math.floor(min), max: Math.ceil(max) }
}

export function airlinesIn(offers: Offer[]): { iataCode: string; name: string }[] {
  const byCode = new Map<string, string>()
  for (const offer of offers) {
    if (offer.airline.iataCode && !byCode.has(offer.airline.iataCode)) {
      byCode.set(offer.airline.iataCode, offer.airline.name)
    }
  }
  return [...byCode.entries()]
    .map(([iataCode, name]) => ({ iataCode, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
