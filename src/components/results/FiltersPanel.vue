<script setup lang="ts">
import { computed, useId } from 'vue'
import type { OfferFilters, StopsBucket } from '@/types/domain'
import { countActiveFilters } from '@/lib/offersView'

// This panel is rendered twice at once (desktop sidebar + mobile sheet), so
// element ids must be unique per instance to keep label associations valid.
const uid = useId()
const fieldId = (name: string) => `${uid}-${name}`

const props = defineProps<{
  filters: OfferFilters
  priceBounds: { min: number; max: number } | null
  airlines: { iataCode: string; name: string }[]
}>()

const emit = defineEmits<{
  'update:filters': [value: OfferFilters]
  reset: []
}>()

const STOPS_OPTIONS: { value: StopsBucket; label: string }[] = [
  { value: 0, label: 'Nonstop' },
  { value: 1, label: '1 stop' },
  { value: 2, label: '2+ stops' },
]

/** Hour steps for the departure-time window selects. */
const FROM_HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const TO_HOURS = Array.from({ length: 24 }, (_, hour) => hour + 1)

const hasActive = computed(() => countActiveFilters(props.filters) > 0)

function patch(changes: Partial<OfferFilters>): void {
  emit('update:filters', { ...props.filters, ...changes })
}

function toggleStops(bucket: StopsBucket): void {
  const stops = props.filters.stops.includes(bucket)
    ? props.filters.stops.filter((existing) => existing !== bucket)
    : [...props.filters.stops, bucket]
  patch({ stops })
}

function toggleAirline(iataCode: string): void {
  const airlines = props.filters.airlines.includes(iataCode)
    ? props.filters.airlines.filter((existing) => existing !== iataCode)
    : [...props.filters.airlines, iataCode]
  patch({ airlines })
}

function onPriceInput(bound: 'priceMin' | 'priceMax', event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  const parsed = raw === '' ? null : Number(raw)
  patch({ [bound]: parsed !== null && Number.isFinite(parsed) && parsed >= 0 ? parsed : null })
}

function onTimeChange(bound: 'departureFrom' | 'departureTo', event: Event): void {
  const raw = (event.target as HTMLSelectElement).value
  patch({ [bound]: raw === '' ? null : Number(raw) })
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-900">Filters</h3>
      <button
        v-if="hasActive"
        type="button"
        class="text-xs font-medium text-sky-700 underline-offset-2 hover:underline"
        @click="emit('reset')"
      >
        Clear all
      </button>
    </div>

    <fieldset>
      <legend class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Stops
      </legend>
      <div class="space-y-2">
        <label
          v-for="option in STOPS_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
        >
          <input
            type="checkbox"
            :checked="filters.stops.includes(option.value)"
            class="size-4 rounded border-slate-300 accent-sky-600"
            @change="toggleStops(option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Price
      </legend>
      <div class="flex items-center gap-2">
        <label class="sr-only" :for="fieldId('price-min')">Minimum price</label>
        <input
          :id="fieldId('price-min')"
          type="number"
          min="0"
          inputmode="numeric"
          :value="filters.priceMin ?? ''"
          :placeholder="priceBounds ? String(priceBounds.min) : 'Min'"
          class="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
          @input="onPriceInput('priceMin', $event)"
        />
        <span class="text-slate-500" aria-hidden="true">–</span>
        <label class="sr-only" :for="fieldId('price-max')">Maximum price</label>
        <input
          :id="fieldId('price-max')"
          type="number"
          min="0"
          inputmode="numeric"
          :value="filters.priceMax ?? ''"
          :placeholder="priceBounds ? String(priceBounds.max) : 'Max'"
          class="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
          @input="onPriceInput('priceMax', $event)"
        />
      </div>
    </fieldset>

    <fieldset>
      <legend class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Departure time
      </legend>
      <div class="flex items-center gap-2">
        <label class="sr-only" :for="fieldId('departure-from')">Departing after</label>
        <select
          :id="fieldId('departure-from')"
          :value="filters.departureFrom ?? ''"
          class="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
          @change="onTimeChange('departureFrom', $event)"
        >
          <option value="">Any</option>
          <option v-for="hour in FROM_HOURS" :key="hour" :value="hour * 60">
            {{ hourLabel(hour) }}
          </option>
        </select>
        <span class="text-slate-500" aria-hidden="true">–</span>
        <label class="sr-only" :for="fieldId('departure-to')">Departing before</label>
        <select
          :id="fieldId('departure-to')"
          :value="filters.departureTo ?? ''"
          class="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
          @change="onTimeChange('departureTo', $event)"
        >
          <option value="">Any</option>
          <option v-for="hour in TO_HOURS" :key="hour" :value="hour * 60">
            {{ hourLabel(hour) }}
          </option>
        </select>
      </div>
    </fieldset>

    <fieldset v-if="airlines.length > 1">
      <legend class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Airlines
      </legend>
      <div class="space-y-2">
        <label
          v-for="airline in airlines"
          :key="airline.iataCode"
          class="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
        >
          <input
            type="checkbox"
            :checked="filters.airlines.includes(airline.iataCode)"
            class="size-4 rounded border-slate-300 accent-sky-600"
            @change="toggleAirline(airline.iataCode)"
          />
          <span class="truncate">{{ airline.name }}</span>
        </label>
      </div>
    </fieldset>
  </div>
</template>
