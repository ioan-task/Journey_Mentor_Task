<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { CabinClass } from '@/types/domain'
import { useSearchStore } from '@/stores/searchStore'
import { useSearchFormValidation } from '@/composables/useSearchFormValidation'
import { todayLocalIso } from '@/lib/datetime'
import AirportCombobox from '@/components/search/AirportCombobox.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseField from '@/components/ui/BaseField.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
]

const store = useSearchStore()
const { params, activeEntry } = storeToRefs(store)
const { visibleErrors, touch, validateAll } = useSearchFormValidation(params)

const minDeparture = todayLocalIso()
const searching = computed(() => activeEntry.value?.status === 'loading')

function swapPlaces(): void {
  const origin = params.value.origin
  params.value.origin = params.value.destination
  params.value.destination = origin
}

function onReturnDateInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  params.value.returnDate = value === '' ? null : value
}

function onSubmit(): void {
  if (!validateAll()) return
  store.submit()
}
</script>

<template>
  <form
    class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    novalidate
    @submit.prevent="onSubmit"
  >
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-4">
      <div class="col-span-2 flex flex-col gap-2 sm:flex-row sm:items-start lg:col-span-6">
        <div class="min-w-0 flex-1">
          <BaseField label="From" for-id="origin" :error="visibleErrors.origin">
            <AirportCombobox
              id="origin"
              v-model="params.origin"
              placeholder="City or airport"
              :invalid="Boolean(visibleErrors.origin)"
              @blur="touch('origin')"
            />
          </BaseField>
        </div>
        <button
          type="button"
          aria-label="Swap origin and destination"
          class="self-center rounded-full border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:mt-6"
          @click="swapPlaces"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="size-4" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M13.2 2.3a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1 0 1.4l-3 3a1 1 0 0 1-1.4-1.4L14.58 7H4a1 1 0 0 1 0-2h10.59l-1.3-1.3a1 1 0 0 1 0-1.4Zm-6.4 8a1 1 0 0 1 0 1.4L5.4 13H16a1 1 0 1 1 0 2H5.41l1.3 1.3a1 1 0 1 1-1.42 1.4l-3-3a1 1 0 0 1 0-1.4l3-3a1 1 0 0 1 1.42 0Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <BaseField label="To" for-id="destination" :error="visibleErrors.destination">
            <AirportCombobox
              id="destination"
              v-model="params.destination"
              placeholder="City or airport"
              :invalid="Boolean(visibleErrors.destination)"
              @blur="touch('destination')"
            />
          </BaseField>
        </div>
      </div>

      <div class="col-span-1 lg:col-span-3">
        <BaseField label="Departure" for-id="departure-date" :error="visibleErrors.departureDate">
          <input
            id="departure-date"
            v-model="params.departureDate"
            type="date"
            :min="minDeparture"
            :aria-invalid="Boolean(visibleErrors.departureDate) || undefined"
            :aria-describedby="visibleErrors.departureDate ? 'departure-date-error' : undefined"
            class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
            :class="visibleErrors.departureDate ? 'border-red-400' : 'border-slate-300'"
            @blur="touch('departureDate')"
          />
        </BaseField>
      </div>

      <div class="col-span-1 lg:col-span-3">
        <BaseField label="Return (optional)" for-id="return-date" :error="visibleErrors.returnDate">
          <input
            id="return-date"
            type="date"
            :value="params.returnDate ?? ''"
            :min="params.departureDate || minDeparture"
            :aria-invalid="Boolean(visibleErrors.returnDate) || undefined"
            :aria-describedby="visibleErrors.returnDate ? 'return-date-error' : undefined"
            class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
            :class="visibleErrors.returnDate ? 'border-red-400' : 'border-slate-300'"
            @input="onReturnDateInput"
            @blur="touch('returnDate')"
          />
        </BaseField>
      </div>

      <div class="col-span-1 lg:col-span-3">
        <BaseField label="Travellers" for-id="passengers" :error="visibleErrors.passengers">
          <input
            id="passengers"
            v-model.number="params.passengers"
            type="number"
            min="1"
            max="9"
            step="1"
            inputmode="numeric"
            :aria-invalid="Boolean(visibleErrors.passengers) || undefined"
            :aria-describedby="visibleErrors.passengers ? 'passengers-error' : undefined"
            class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
            :class="visibleErrors.passengers ? 'border-red-400' : 'border-slate-300'"
            @blur="touch('passengers')"
          />
        </BaseField>
      </div>

      <div class="col-span-1 lg:col-span-3">
        <BaseField label="Cabin class" for-id="cabin-class">
          <select
            id="cabin-class"
            v-model="params.cabinClass"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
          >
            <option v-for="option in CABIN_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </BaseField>
      </div>

      <div class="col-span-2 flex items-end lg:col-span-6">
        <BaseButton type="submit" class="w-full lg:ml-auto lg:w-auto lg:px-8" :disabled="searching">
          <BaseSpinner v-if="searching" />
          {{ searching ? 'Searching…' : 'Search flights' }}
        </BaseButton>
      </div>
    </div>
  </form>
</template>
