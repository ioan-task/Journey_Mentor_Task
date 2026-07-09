import { describe, expect, it } from 'vitest'
import { mapOffer } from '@/api/duffel/mapOffer'
import { mapPlace } from '@/api/duffel/places'
import { sandboxOffer } from '../fixtures/duffelOffer'

describe('mapOffer', () => {
  it('maps a sandbox offer into the domain model', () => {
    const offer = mapOffer(sandboxOffer)
    expect(offer).not.toBeNull()

    expect(offer!.id).toBe(sandboxOffer.id)
    expect(offer!.totalAmount).toBe(412.53)
    expect(offer!.currency).toBe('EUR')
    expect(offer!.airline).toEqual({
      name: 'Duffel Airways',
      iataCode: 'ZZ',
      logoUrl: 'https://assets.duffel.com/img/airlines/ZZ.svg',
    })

    const slice = offer!.slices[0]!
    expect(slice.originIata).toBe('LHR')
    expect(slice.destinationIata).toBe('JFK')
    expect(slice.originCity).toBe('London')
    expect(slice.destinationCity).toBe('New York')
    expect(slice.departingAt).toBe('2026-07-20T09:15:00')
    expect(slice.arrivingAt).toBe('2026-07-20T16:40:00')
    expect(slice.durationMinutes).toBe(11 * 60 + 25)
    expect(slice.stops).toBe(1)
    expect(slice.fareBrandName).toBe('Economy Basic')
  })

  it('maps segments with carrier, cabin and baggage details', () => {
    const [first, second] = mapOffer(sandboxOffer)!.slices[0]!.segments
    expect(first!.carrierIata).toBe('ZZ')
    expect(first!.flightNumber).toBe('0316')
    // Same marketing and operating carrier — no "operated by" noise.
    expect(first!.operatingCarrierName).toBeNull()
    expect(first!.checkedBags).toBe(1)
    expect(first!.carryOnBags).toBe(1)
    expect(first!.cabinName).toBe('Economy Basic')

    expect(second!.operatingCarrierName).toBe('Partner Wings')
    expect(second!.carryOnBags).toBe(0)
    expect(second!.aircraftName).toBe('Airbus A350-900')
  })

  it('maps fare conditions including penalties', () => {
    const conditions = mapOffer(sandboxOffer)!.conditions
    expect(conditions.change).toEqual({
      allowed: true,
      penaltyAmount: 50,
      penaltyCurrency: 'EUR',
    })
    expect(conditions.refund).toEqual({
      allowed: false,
      penaltyAmount: null,
      penaltyCurrency: null,
    })
  })

  it('rejects offers missing the essentials', () => {
    expect(mapOffer({ ...sandboxOffer, total_amount: undefined })).toBeNull()
    expect(mapOffer({ ...sandboxOffer, total_amount: 'not-a-number' })).toBeNull()
    expect(mapOffer({ ...sandboxOffer, slices: [] })).toBeNull()
  })

  it('rejects the whole offer if any segment in a slice fails to map', () => {
    const slice = sandboxOffer.slices![0]!
    // Break only the second segment: dropping it silently would misreport the
    // itinerary, so the offer must be rejected entirely.
    const broken = {
      ...sandboxOffer,
      slices: [
        {
          ...slice,
          segments: [slice.segments![0]!, { ...slice.segments![1]!, departing_at: undefined }],
        },
      ],
    }
    expect(mapOffer(broken)).toBeNull()
  })
})

describe('mapPlace', () => {
  it('maps airports and cities', () => {
    expect(
      mapPlace({
        id: 'arp_lhr_gb',
        name: 'Heathrow',
        type: 'airport',
        iata_code: 'LHR',
        city_name: 'London',
      }),
    ).toEqual({ iataCode: 'LHR', name: 'Heathrow', cityName: 'London', type: 'airport' })
    expect(
      mapPlace({
        id: 'cit_lon_gb',
        name: 'London',
        type: 'city',
        iata_code: 'LON',
        city_name: null,
      }),
    ).toEqual({ iataCode: 'LON', name: 'London', cityName: null, type: 'city' })
  })

  it('rejects places without an IATA code', () => {
    expect(mapPlace({ id: 'x', name: 'Nowhere', type: 'airport', iata_code: null })).toBeNull()
  })
})
