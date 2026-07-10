<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/stores/searchStore'
import { addDays, formatDayLabel, todayLocalIso } from '@/lib/datetime'
import { formatMoneyRounded } from '@/lib/money'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

const WINDOW_SIZE = 7
const HALF_WINDOW = Math.floor(WINDOW_SIZE / 2)

const store = useSearchStore()
const { activeDate, cache, committed } = storeToRefs(store)

const center = ref(activeDate.value ?? todayLocalIso())
watch(activeDate, (date) => {
  if (date) center.value = date
})

interface DateChip {
  date: string
  label: string
  priceLabel: string | null
  loading: boolean
  active: boolean
  disabled: boolean
}

const chips = computed<DateChip[]>(() => {
  const today = todayLocalIso()
  const returnDate = committed.value?.returnDate ?? null
  return Array.from({ length: WINDOW_SIZE }, (_, index) => {
    const date = addDays(center.value, index - HALF_WINDOW)
    const entry = cache.value.get(date)
    const currency = entry?.offers[0]?.currency
    return {
      date,
      label: formatDayLabel(date),
      priceLabel:
        entry?.cheapestAmount != null && currency
          ? formatMoneyRounded(entry.cheapestAmount, currency)
          : null,
      loading: entry?.status === 'loading',
      active: date === activeDate.value,
      disabled: date < today || (returnDate !== null && date > returnDate),
    }
  })
})

const canShiftBack = computed(() => chips.value[0]!.date > todayLocalIso())

function shiftWindow(delta: number): void {
  center.value = addDays(center.value, delta)
}

function onChipClick(chip: DateChip): void {
  if (chip.disabled || chip.active) return
  store.activateDate(chip.date)
}
</script>

<template>
  <nav aria-label="Nearby departure dates" class="flex items-center gap-2">
    <button
      type="button"
      aria-label="Earlier dates"
      :disabled="!canShiftBack"
      class="shrink-0 rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
      @click="shiftWindow(-1)"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" class="size-4" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 1 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.42 0Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <ul class="flex flex-1 gap-2 overflow-x-auto py-1">
      <!-- Fixed-width and horizontally scrollable on mobile; stretched to fill
           the row on desktop, where all seven chips fit comfortably. -->
      <li v-for="chip in chips" :key="chip.date" class="w-20 shrink-0 lg:w-auto lg:flex-1">
        <button
          type="button"
          :disabled="chip.disabled"
          :aria-current="chip.active ? 'date' : undefined"
          class="flex w-full flex-col items-center rounded-lg border px-2 py-1.5 text-xs whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
          :class="
            chip.active
              ? 'border-sky-700 bg-sky-700 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
          "
          @click="onChipClick(chip)"
        >
          <span class="font-medium whitespace-nowrap">{{ chip.label }}</span>
          <span
            class="mt-0.5 flex h-4 items-center"
            :class="chip.active ? 'text-sky-100' : 'text-slate-500'"
          >
            <BaseSpinner v-if="chip.loading" />
            <template v-else-if="chip.priceLabel">from {{ chip.priceLabel }}</template>
            <template v-else>—</template>
          </span>
        </button>
      </li>
    </ul>

    <button
      type="button"
      aria-label="Later dates"
      class="shrink-0 rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      @click="shiftWindow(1)"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" class="size-4" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M7.3 15.7a1 1 0 0 1 0-1.4L11.58 10l-4.3-4.3A1 1 0 0 1 8.7 4.3l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4 0Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </nav>
</template>
