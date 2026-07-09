import { computed, reactive } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { SearchParams } from '@/types/domain'
import { addDays, todayLocalIso } from '@/lib/datetime'

export type SearchField = 'origin' | 'destination' | 'departureDate' | 'returnDate' | 'passengers'

const BOOKING_HORIZON_DAYS = 361

export interface SearchFormValidation {
  errors: ComputedRef<Partial<Record<SearchField, string>>>
  visibleErrors: ComputedRef<Partial<Record<SearchField, string>>>
  isValid: ComputedRef<boolean>
  touch: (field: SearchField) => void
  validateAll: () => boolean
}

export function useSearchFormValidation(model: Ref<SearchParams>): SearchFormValidation {
  const touched = reactive<Record<SearchField, boolean>>({
    origin: false,
    destination: false,
    departureDate: false,
    returnDate: false,
    passengers: false,
  })

  const errors = computed<Partial<Record<SearchField, string>>>(() => {
    const value = model.value
    const result: Partial<Record<SearchField, string>> = {}

    if (!value.origin) {
      result.origin = 'Select an origin from the suggestions.'
    }
    if (!value.destination) {
      result.destination = 'Select a destination from the suggestions.'
    } else if (value.origin && value.destination.iataCode === value.origin.iataCode) {
      result.destination = 'Destination must be different from the origin.'
    }

    const today = todayLocalIso()
    if (!value.departureDate) {
      result.departureDate = 'Choose a departure date.'
    } else if (value.departureDate < today) {
      result.departureDate = 'Departure date cannot be in the past.'
    } else if (value.departureDate > addDays(today, BOOKING_HORIZON_DAYS)) {
      result.departureDate = 'Departure date is too far ahead.'
    }

    if (
      value.returnDate !== null &&
      value.departureDate &&
      value.returnDate < value.departureDate
    ) {
      result.returnDate = 'Return date must be on or after departure.'
    }

    if (!Number.isInteger(value.passengers) || value.passengers < 1 || value.passengers > 9) {
      result.passengers = 'Passengers must be between 1 and 9.'
    }

    return result
  })

  const visibleErrors = computed<Partial<Record<SearchField, string>>>(() => {
    const visible: Partial<Record<SearchField, string>> = {}
    for (const [field, message] of Object.entries(errors.value) as [SearchField, string][]) {
      if (touched[field]) visible[field] = message
    }
    return visible
  })

  const isValid = computed(() => Object.keys(errors.value).length === 0)

  function touch(field: SearchField): void {
    touched[field] = true
  }

  function validateAll(): boolean {
    for (const field of Object.keys(touched) as SearchField[]) touched[field] = true
    return isValid.value
  }

  return { errors, visibleErrors, isValid, touch, validateAll }
}
