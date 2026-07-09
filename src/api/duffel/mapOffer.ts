import type { FareCondition, Offer, Segment, Slice } from '@/types/domain'
import type { DuffelCondition, DuffelOffer, DuffelSegment, DuffelSlice } from './types'
import { parseIsoDurationMinutes } from '@/lib/duration'

export function mapOffer(raw: DuffelOffer): Offer | null {
  const amount = Number(raw.total_amount)
  if (!raw.id || !raw.total_amount || !Number.isFinite(amount)) return null

  const slices = (raw.slices ?? []).map(mapSlice).filter((slice): slice is Slice => slice !== null)
  if (slices.length === 0) return null

  return {
    id: raw.id,
    totalAmount: amount,
    currency: raw.total_currency ?? 'EUR',
    expiresAt: raw.expires_at ?? '',
    airline: {
      name: raw.owner?.name ?? 'Unknown airline',
      iataCode: raw.owner?.iata_code ?? null,
      logoUrl: raw.owner?.logo_symbol_url ?? null,
    },
    slices,
    conditions: {
      change: mapCondition(raw.conditions?.change_before_departure),
      refund: mapCondition(raw.conditions?.refund_before_departure),
    },
  }
}

function mapSlice(raw: DuffelSlice): Slice | null {
  const rawSegments = raw.segments ?? []
  const segments = rawSegments
    .map(mapSegment)
    .filter((segment): segment is Segment => segment !== null)
  // Drop the whole slice if any segment failed to map: a partial itinerary
  // would show a missing leg, the wrong stop count and a bogus layover.
  if (segments.length === 0 || segments.length !== rawSegments.length) return null
  const first = segments[0]!
  const last = segments[segments.length - 1]!

  return {
    id: raw.id,
    originIata: first.originIata,
    originCity: raw.origin?.city_name ?? raw.origin?.name ?? first.originIata,
    destinationIata: last.destinationIata,
    destinationCity: raw.destination?.city_name ?? raw.destination?.name ?? last.destinationIata,
    departingAt: first.departingAt,
    arrivingAt: last.arrivingAt,
    durationMinutes: parseIsoDurationMinutes(raw.duration),
    stops: segments.length - 1,
    fareBrandName: raw.fare_brand_name ?? null,
    segments,
  }
}

function mapSegment(raw: DuffelSegment): Segment | null {
  if (!raw.departing_at || !raw.arriving_at) return null

  const marketingName = raw.marketing_carrier?.name ?? 'Unknown airline'
  const operatingName = raw.operating_carrier?.name ?? null
  const cabin = raw.passengers?.[0]

  let checkedBags = 0
  let carryOnBags = 0
  for (const bag of cabin?.baggages ?? []) {
    if (bag.type === 'checked') checkedBags += bag.quantity ?? 0
    if (bag.type === 'carry_on') carryOnBags += bag.quantity ?? 0
  }

  return {
    id: raw.id,
    originIata: raw.origin?.iata_code ?? '',
    originName: raw.origin?.name ?? raw.origin?.iata_code ?? '',
    destinationIata: raw.destination?.iata_code ?? '',
    destinationName: raw.destination?.name ?? raw.destination?.iata_code ?? '',
    departingAt: raw.departing_at,
    arrivingAt: raw.arriving_at,
    durationMinutes: parseIsoDurationMinutes(raw.duration),
    carrierName: marketingName,
    carrierIata: raw.marketing_carrier?.iata_code ?? null,
    flightNumber: raw.marketing_carrier_flight_number ?? '',
    operatingCarrierName: operatingName && operatingName !== marketingName ? operatingName : null,
    aircraftName: raw.aircraft?.name ?? null,
    cabinName: cabin?.cabin_class_marketing_name ?? null,
    checkedBags,
    carryOnBags,
  }
}

function mapCondition(raw: DuffelCondition | null | undefined): FareCondition | null {
  if (!raw || typeof raw.allowed !== 'boolean') return null
  const penalty = raw.penalty_amount != null ? Number(raw.penalty_amount) : null
  return {
    allowed: raw.allowed,
    penaltyAmount: penalty != null && Number.isFinite(penalty) ? penalty : null,
    penaltyCurrency: raw.penalty_currency ?? null,
  }
}
