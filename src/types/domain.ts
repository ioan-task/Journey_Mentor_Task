export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first'

export type SortKey = 'price' | 'duration' | 'departure'

export type StopsBucket = 0 | 1 | 2

export interface PlaceRef {
  iataCode: string
  name: string
  cityName: string | null
  type: 'airport' | 'city'
}

export interface SearchParams {
  origin: PlaceRef | null
  destination: PlaceRef | null
  departureDate: string
  returnDate: string | null
  passengers: number
  cabinClass: CabinClass
}

export interface OfferFilters {
  stops: StopsBucket[]
  priceMin: number | null
  priceMax: number | null
  departureFrom: number | null
  departureTo: number | null
  airlines: string[]
}

export interface FareCondition {
  allowed: boolean
  penaltyAmount: number | null
  penaltyCurrency: string | null
}

export interface AirlineRef {
  name: string
  iataCode: string | null
  logoUrl: string | null
}

export interface Segment {
  id: string
  originIata: string
  originName: string
  destinationIata: string
  destinationName: string
  departingAt: string
  arrivingAt: string
  durationMinutes: number | null
  carrierName: string
  carrierIata: string | null
  flightNumber: string
  operatingCarrierName: string | null
  aircraftName: string | null
  cabinName: string | null
  checkedBags: number
  carryOnBags: number
}

export interface Slice {
  id: string
  originIata: string
  originCity: string
  destinationIata: string
  destinationCity: string
  departingAt: string
  arrivingAt: string
  durationMinutes: number | null
  stops: number
  fareBrandName: string | null
  segments: Segment[]
}

export interface Offer {
  id: string
  totalAmount: number
  currency: string
  expiresAt: string
  airline: AirlineRef
  slices: Slice[]
  conditions: {
    change: FareCondition | null
    refund: FareCondition | null
  }
}

export type EntryStatus = 'loading' | 'success' | 'empty' | 'error'

export interface DateWindowEntry {
  status: EntryStatus
  offers: Offer[]
  fetchedAt: number
  cheapestAmount: number | null
  error: string | null
}

export interface SearchHistoryEntry {
  params: SearchParams
  savedAt: number
}
