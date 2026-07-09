import type { PlaceRef } from '@/types/domain'
import type { DuffelListResponse, DuffelPlace } from './types'
import { requestJson } from '@/api/http'

export function mapPlace(raw: DuffelPlace): PlaceRef | null {
  if (!raw.iata_code || !raw.name) return null
  return {
    iataCode: raw.iata_code,
    name: raw.name,
    cityName: raw.city_name ?? null,
    type: raw.type === 'city' ? 'city' : 'airport',
  }
}

export async function fetchPlaceSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceRef[]> {
  const response = await requestJson<DuffelListResponse<DuffelPlace>>(
    `/api/duffel/places/suggestions?query=${encodeURIComponent(query)}`,
    { signal },
  )
  return response.data.map(mapPlace).filter((place): place is PlaceRef => place !== null)
}
