import type { CabinClass } from '@/types/domain'

export interface DuffelResponse<T> {
  data: T
}

export interface DuffelListResponse<T> {
  data: T[]
}

export interface OfferRequestBody {
  data: {
    slices: { origin: string; destination: string; departure_date: string }[]
    passengers: { type: 'adult' }[]
    cabin_class?: CabinClass
    max_connections: number
  }
}

export interface DuffelOfferRequest {
  id: string
  offers?: DuffelOffer[]
}

export interface DuffelAirline {
  name?: string
  iata_code?: string | null
  logo_symbol_url?: string | null
}

export interface DuffelCondition {
  allowed?: boolean
  penalty_amount?: string | null
  penalty_currency?: string | null
}

export interface DuffelPlaceSummary {
  iata_code?: string
  name?: string
  city_name?: string | null
}

export interface DuffelSegmentPassenger {
  cabin_class_marketing_name?: string | null
  baggages?: { type?: string; quantity?: number }[]
}

export interface DuffelSegment {
  id: string
  origin?: DuffelPlaceSummary
  destination?: DuffelPlaceSummary
  departing_at?: string
  arriving_at?: string
  duration?: string | null
  marketing_carrier?: DuffelAirline
  marketing_carrier_flight_number?: string
  operating_carrier?: DuffelAirline
  aircraft?: { name?: string } | null
  passengers?: DuffelSegmentPassenger[]
}

export interface DuffelSlice {
  id: string
  origin?: DuffelPlaceSummary
  destination?: DuffelPlaceSummary
  duration?: string | null
  fare_brand_name?: string | null
  segments?: DuffelSegment[]
}

export interface DuffelOffer {
  id: string
  total_amount?: string
  total_currency?: string
  expires_at?: string
  owner?: DuffelAirline
  slices?: DuffelSlice[]
  conditions?: {
    change_before_departure?: DuffelCondition | null
    refund_before_departure?: DuffelCondition | null
  }
}

export interface DuffelPlace {
  id: string
  name?: string
  type?: string
  iata_code?: string | null
  city_name?: string | null
}
