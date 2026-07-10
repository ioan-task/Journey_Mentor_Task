<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Offer } from '@/types/domain'
import { formatMoney } from '@/lib/money'
import OfferDetails from '@/components/offer/OfferDetails.vue'
import SliceSummary from '@/components/offer/SliceSummary.vue'

const props = defineProps<{ offer: Offer }>()

const expanded = ref(false)
const logoFailed = ref(false)
const detailsId = computed(() => `offer-details-${props.offer.id}`)
</script>

<template>
  <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="flex min-w-0 flex-1 gap-3">
        <img
          v-if="offer.airline.logoUrl && !logoFailed"
          :src="offer.airline.logoUrl"
          alt=""
          class="mt-0.5 size-8 shrink-0 rounded"
          @error="logoFailed = true"
        />
        <span
          v-else
          aria-hidden="true"
          class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-500"
        >
          {{ offer.airline.iataCode ?? '✈' }}
        </span>
        <div class="min-w-0 flex-1 space-y-2">
          <p class="truncate text-sm text-slate-500">{{ offer.airline.name }}</p>
          <SliceSummary v-for="slice in offer.slices" :key="slice.id" :slice="slice" />
        </div>
      </div>
      <div class="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
        <div class="text-right">
          <p class="text-xl font-bold text-slate-900">
            {{ formatMoney(offer.totalAmount, offer.currency) }}
          </p>
          <p class="text-xs text-slate-500">total price</p>
        </div>
        <button
          type="button"
          :aria-expanded="expanded"
          :aria-controls="detailsId"
          class="inline-flex items-center gap-1 text-sm font-medium text-sky-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Hide details' : 'Details' }}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            class="size-4 transition-transform"
            :class="expanded ? 'rotate-180' : ''"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.42Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
    <div v-if="expanded" :id="detailsId" class="mt-4">
      <OfferDetails :offer="offer" />
    </div>
  </article>
</template>
