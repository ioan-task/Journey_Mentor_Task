import type { Offer, Segment, Slice } from '@/types/domain'

let counter = 0

export function makeSegment(overrides: Partial<Segment> = {}): Segment {
  counter++
  return {
    id: `seg_${counter}`,
    originIata: 'LHR',
    originName: 'Heathrow',
    destinationIata: 'JFK',
    destinationName: 'John F. Kennedy International',
    departingAt: '2026-07-20T09:00:00',
    arrivingAt: '2026-07-20T12:00:00',
    durationMinutes: 480,
    carrierName: 'Duffel Airways',
    carrierIata: 'ZZ',
    flightNumber: '0100',
    operatingCarrierName: null,
    aircraftName: 'Boeing 777-300',
    cabinName: 'Economy Basic',
    checkedBags: 1,
    carryOnBags: 1,
    ...overrides,
  }
}

export function makeSlice(overrides: Partial<Slice> = {}): Slice {
  counter++
  const segments = overrides.segments ?? [makeSegment()]
  return {
    id: `sli_${counter}`,
    originIata: 'LHR',
    originCity: 'London',
    destinationIata: 'JFK',
    destinationCity: 'New York',
    departingAt: segments[0]!.departingAt,
    arrivingAt: segments[segments.length - 1]!.arrivingAt,
    durationMinutes: 480,
    stops: segments.length - 1,
    fareBrandName: null,
    ...overrides,
    segments,
  }
}

export function makeOffer(overrides: Partial<Offer> = {}): Offer {
  counter++
  return {
    id: `off_${counter}`,
    totalAmount: 400,
    currency: 'EUR',
    expiresAt: '2099-01-01T00:00:00Z',
    airline: { name: 'Duffel Airways', iataCode: 'ZZ', logoUrl: null },
    slices: [makeSlice()],
    conditions: { change: null, refund: null },
    ...overrides,
  }
}
