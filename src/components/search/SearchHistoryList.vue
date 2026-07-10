<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { SearchParams } from '@/types/domain'
import { useHistoryStore } from '@/stores/historyStore'
import { useSearchStore } from '@/stores/searchStore'
import { formatDayLabel } from '@/lib/datetime'

const historyStore = useHistoryStore()
const searchStore = useSearchStore()
const { entries } = storeToRefs(historyStore)

const CABIN_LABELS: Record<SearchParams['cabinClass'], string> = {
  economy: 'Economy',
  premium_economy: 'Premium economy',
  business: 'Business',
  first: 'First',
}

function describe(params: SearchParams): string {
  const route = `${params.origin?.iataCode ?? '?'} → ${params.destination?.iataCode ?? '?'}`
  const dates = params.returnDate
    ? `${formatDayLabel(params.departureDate)} – ${formatDayLabel(params.returnDate)}`
    : formatDayLabel(params.departureDate)
  const travellers = params.passengers === 1 ? '1 traveller' : `${params.passengers} travellers`
  return `${route} · ${dates} · ${travellers} · ${CABIN_LABELS[params.cabinClass]}`
}
</script>

<template>
  <section v-if="entries.length > 0" aria-label="Recent searches" class="mt-3">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Recent searches</h2>
      <button
        type="button"
        class="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        @click="historyStore.clear()"
      >
        Clear
      </button>
    </div>
    <ul class="mt-2 flex flex-wrap gap-2">
      <li v-for="entry in entries" :key="entry.savedAt">
        <button
          type="button"
          class="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-sky-400 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          @click="searchStore.applySearch(entry.params)"
        >
          {{ describe(entry.params) }}
        </button>
      </li>
    </ul>
  </section>
</template>
