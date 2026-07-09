import type { Offer, SearchParams } from '@/types/domain'
import type { DuffelOfferRequest, DuffelResponse, OfferRequestBody } from './types'
import { requestJson } from '@/api/http'
import { mapOffer } from './mapOffer'

export async function searchOffers(
  params: SearchParams,
  departureDate: string,
  signal?: AbortSignal,
): Promise<Offer[]> {
  const { origin, destination } = params
  if (!origin || !destination) throw new Error('Origin and destination are required')

  const slices: OfferRequestBody['data']['slices'] = [
    { origin: origin.iataCode, destination: destination.iataCode, departure_date: departureDate },
  ]
  if (params.returnDate) {
    slices.push({
      origin: destination.iataCode,
      destination: origin.iataCode,
      departure_date: params.returnDate,
    })
  }

  const body: OfferRequestBody = {
    data: {
      slices,
      passengers: Array.from({ length: params.passengers }, () => ({ type: 'adult' as const })),
      cabin_class: params.cabinClass,
      max_connections: 2,
    },
  }

  const response = await requestJson<DuffelResponse<DuffelOfferRequest>>(
    '/api/duffel/air/offer_requests?return_offers=true&supplier_timeout=20000',
    { method: 'POST', body: JSON.stringify(body), signal },
  )

  return (response.data.offers ?? [])
    .map(mapOffer)
    .filter((offer): offer is Offer => offer !== null)
}
