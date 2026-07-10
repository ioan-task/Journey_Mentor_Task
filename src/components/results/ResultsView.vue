<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/stores/searchStore'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import OfferCard from '@/components/offer/OfferCard.vue'
import DateWindowStrip from '@/components/results/DateWindowStrip.vue'
import FiltersPanel from '@/components/results/FiltersPanel.vue'
import OfferCardSkeleton from '@/components/results/OfferCardSkeleton.vue'
import SortBar from '@/components/results/SortBar.vue'

const store = useSearchStore()
const {
  hasSearched,
  activeEntry,
  rawOffers,
  visibleOffers,
  isFilteredEmpty,
  filters,
  sort,
  currentPriceBounds,
  availableAirlines,
  activeFilterCount,
  activeOffersExpired,
} = storeToRefs(store)

const filtersOpen = ref(false)
const sheetRef = ref<HTMLElement | null>(null)
// The element that opened the sheet, so focus can return to it on close.
let triggerEl: HTMLElement | null = null

watch(filtersOpen, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    triggerEl = document.activeElement as HTMLElement | null
    await nextTick()
    sheetRef.value?.focus()
  } else {
    // Restore focus to the trigger; it may have unmounted (unlikely here).
    triggerEl?.focus?.()
    triggerEl = null
  }
})

function focusableInSheet(): HTMLElement[] {
  if (!sheetRef.value) return []
  return Array.from(
    sheetRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function onSheetKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    filtersOpen.value = false
    return
  }
  if (event.key !== 'Tab') return
  // Trap Tab inside the dialog so focus can't reach the inert background.
  const focusables = focusableInSheet()
  if (focusables.length === 0) {
    event.preventDefault()
    return
  }
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  const active = document.activeElement
  if (event.shiftKey) {
    if (active === first || active === sheetRef.value) {
      event.preventDefault()
      last.focus()
    }
  } else if (active === last) {
    event.preventDefault()
    first.focus()
  }
}

// A viewport that grows past the lg breakpoint hides the mobile sheet via CSS;
// close it explicitly so the body scroll-lock is released and state stays sane.
let desktopQuery: MediaQueryList | undefined
function onBreakpointChange(event: MediaQueryListEvent): void {
  if (event.matches) filtersOpen.value = false
}

onMounted(() => {
  desktopQuery = window.matchMedia('(min-width: 1024px)')
  desktopQuery.addEventListener('change', onBreakpointChange)
})

onBeforeUnmount(() => {
  desktopQuery?.removeEventListener('change', onBreakpointChange)
  document.body.style.overflow = ''
})
</script>

<template>
  <section v-if="hasSearched" aria-label="Search results" class="space-y-4">
    <h2 class="sr-only">Search results</h2>
    <DateWindowStrip />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p role="status" class="text-sm text-slate-600">
        <template v-if="activeEntry?.status === 'success'">
          {{
            visibleOffers.length === rawOffers.length
              ? `${rawOffers.length} flights`
              : `${visibleOffers.length} of ${rawOffers.length} flights`
          }}
        </template>
      </p>
      <div class="flex items-center gap-2">
        <SortBar v-model="sort" />
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 lg:hidden"
          @click="filtersOpen = true"
        >
          Filters
          <span
            v-if="activeFilterCount > 0"
            class="rounded-full bg-sky-600 px-1.5 text-[10px] font-semibold text-white"
          >
            {{ activeFilterCount }}
          </span>
        </button>
      </div>
    </div>

    <div class="items-start gap-6 lg:flex">
      <aside
        class="sticky top-4 hidden max-h-[calc(100vh-2rem)] w-64 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:block"
      >
        <FiltersPanel
          :filters="filters"
          :price-bounds="currentPriceBounds"
          :airlines="availableAirlines"
          @update:filters="store.filters = $event"
          @reset="store.resetFilters()"
        />
      </aside>

      <div class="min-w-0 flex-1 space-y-3">
        <div
          v-if="activeOffersExpired"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <p class="text-sm text-amber-800">
            These fares may have expired — refresh to get current prices.
          </p>
          <BaseButton variant="ghost" @click="store.refreshActiveDate()">Refresh</BaseButton>
        </div>

        <div
          v-if="!activeEntry || activeEntry.status === 'loading'"
          aria-busy="true"
          class="space-y-3"
        >
          <span class="sr-only" role="status">Loading flights…</span>
          <OfferCardSkeleton v-for="index in 5" :key="index" />
        </div>

        <EmptyState
          v-else-if="activeEntry.status === 'error'"
          tone="error"
          title="The search didn't go through"
          :description="activeEntry.error ?? undefined"
        >
          <template #action>
            <BaseButton @click="store.refreshActiveDate()">Try again</BaseButton>
          </template>
        </EmptyState>

        <EmptyState
          v-else-if="activeEntry.status === 'empty'"
          title="No flights found"
          description="Nothing is available for this route on this date. Try a nearby date above, or adjust your search."
        />

        <EmptyState
          v-else-if="isFilteredEmpty"
          title="No flights match your filters"
          description="Every result is filtered out right now. Loosen or clear the filters to see them."
        >
          <template #action>
            <BaseButton variant="ghost" @click="store.resetFilters()">Clear filters</BaseButton>
          </template>
        </EmptyState>

        <ul v-else class="space-y-3">
          <li v-for="offer in visibleOffers" :key="offer.id">
            <OfferCard :offer="offer" />
          </li>
        </ul>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="filtersOpen" class="fixed inset-0 z-40 lg:hidden">
        <div
          class="absolute inset-0 bg-slate-900/40"
          aria-hidden="true"
          @click="filtersOpen = false"
        ></div>
        <div
          ref="sheetRef"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          tabindex="-1"
          class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl outline-none"
          @keydown="onSheetKeydown"
        >
          <FiltersPanel
            :filters="filters"
            :price-bounds="currentPriceBounds"
            :airlines="availableAirlines"
            @update:filters="store.filters = $event"
            @reset="store.resetFilters()"
          />
          <div class="mt-5">
            <BaseButton class="w-full" @click="filtersOpen = false">
              Show {{ visibleOffers.length }}
              {{ visibleOffers.length === 1 ? 'flight' : 'flights' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
