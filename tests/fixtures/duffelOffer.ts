import type { DuffelOffer } from '@/api/duffel/types'

export const sandboxOffer: DuffelOffer = {
  id: 'off_0000AsdX2QYHhKZi3z1abc',
  total_amount: '412.53',
  total_currency: 'EUR',
  expires_at: '2026-07-09T18:42:14.545Z',
  owner: {
    name: 'Duffel Airways',
    iata_code: 'ZZ',
    logo_symbol_url: 'https://assets.duffel.com/img/airlines/ZZ.svg',
  },
  conditions: {
    change_before_departure: {
      allowed: true,
      penalty_amount: '50.00',
      penalty_currency: 'EUR',
    },
    refund_before_departure: { allowed: false, penalty_amount: null, penalty_currency: null },
  },
  slices: [
    {
      id: 'sli_00009htYpSCXrwaB9Dn123',
      origin: { iata_code: 'LHR', name: 'Heathrow', city_name: 'London' },
      destination: {
        iata_code: 'JFK',
        name: 'John F. Kennedy International Airport',
        city_name: 'New York',
      },
      duration: 'PT11H25M',
      fare_brand_name: 'Economy Basic',
      segments: [
        {
          id: 'seg_00009htYpSCXrwaB9Dn456',
          origin: { iata_code: 'LHR', name: 'Heathrow', city_name: 'London' },
          destination: { iata_code: 'KEF', name: 'Keflavik', city_name: 'Reykjavik' },
          departing_at: '2026-07-20T09:15:00',
          arriving_at: '2026-07-20T12:10:00',
          duration: 'PT2H55M',
          marketing_carrier: { name: 'Duffel Airways', iata_code: 'ZZ' },
          marketing_carrier_flight_number: '0316',
          operating_carrier: { name: 'Duffel Airways', iata_code: 'ZZ' },
          aircraft: { name: 'Boeing 777-300' },
          passengers: [
            {
              cabin_class_marketing_name: 'Economy Basic',
              baggages: [
                { type: 'checked', quantity: 1 },
                { type: 'carry_on', quantity: 1 },
              ],
            },
          ],
        },
        {
          id: 'seg_00009htYpSCXrwaB9Dn789',
          origin: { iata_code: 'KEF', name: 'Keflavik', city_name: 'Reykjavik' },
          destination: {
            iata_code: 'JFK',
            name: 'John F. Kennedy International Airport',
            city_name: 'New York',
          },
          departing_at: '2026-07-20T14:05:00',
          arriving_at: '2026-07-20T16:40:00',
          duration: 'PT6H35M',
          marketing_carrier: { name: 'Duffel Airways', iata_code: 'ZZ' },
          marketing_carrier_flight_number: '0871',
          operating_carrier: { name: 'Partner Wings', iata_code: 'PW' },
          aircraft: { name: 'Airbus A350-900' },
          passengers: [
            {
              cabin_class_marketing_name: 'Economy Basic',
              baggages: [{ type: 'checked', quantity: 1 }],
            },
          ],
        },
      ],
    },
  ],
}
