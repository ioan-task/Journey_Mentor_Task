<script setup lang="ts">
import type { FareCondition, Offer, Slice } from '@/types/domain'
import { datePart, formatDayLabel, layoverMinutes } from '@/lib/datetime'
import { formatMinutes } from '@/lib/duration'
import { formatMoney } from '@/lib/money'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import SegmentRow from '@/components/offer/SegmentRow.vue'

const props = defineProps<{ offer: Offer }>()

function sliceHeading(slice: Slice, index: number): string {
  const direction =
    props.offer.slices.length > 1 ? (index === 0 ? 'Outbound' : 'Return') : 'Itinerary'
  return `${direction} · ${formatDayLabel(datePart(slice.departingAt))}`
}

function conditionLabel(
  kind: 'Changes' | 'Refunds',
  condition: FareCondition | null,
): string | null {
  if (!condition) return null
  if (!condition.allowed) return `${kind} not allowed`
  if (condition.penaltyAmount != null && condition.penaltyAmount > 0) {
    const fee = formatMoney(
      condition.penaltyAmount,
      condition.penaltyCurrency ?? props.offer.currency,
    )
    return `${kind} allowed (fee ${fee})`
  }
  return `${kind} allowed`
}
</script>

<template>
  <div class="space-y-5 border-t border-slate-100 pt-4">
    <section v-for="(slice, index) in offer.slices" :key="slice.id">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <h3 class="text-sm font-semibold text-slate-900">{{ sliceHeading(slice, index) }}</h3>
        <BaseBadge v-if="slice.fareBrandName" tone="info">{{ slice.fareBrandName }}</BaseBadge>
      </div>
      <div class="space-y-3">
        <template v-for="(segment, segmentIndex) in slice.segments" :key="segment.id">
          <SegmentRow :segment="segment" />
          <p
            v-if="segmentIndex < slice.segments.length - 1 && slice.segments[segmentIndex + 1]"
            class="ml-5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500"
          >
            Layover in {{ segment.destinationIata }} ·
            {{
              formatMinutes(
                layoverMinutes(segment.arrivingAt, slice.segments[segmentIndex + 1]!.departingAt),
              )
            }}
          </p>
        </template>
      </div>
    </section>

    <section
      v-if="
        conditionLabel('Changes', offer.conditions.change) ||
        conditionLabel('Refunds', offer.conditions.refund)
      "
      aria-label="Fare conditions"
      class="flex flex-wrap gap-2"
    >
      <BaseBadge
        v-if="conditionLabel('Changes', offer.conditions.change)"
        :tone="offer.conditions.change?.allowed ? 'success' : 'warning'"
      >
        {{ conditionLabel('Changes', offer.conditions.change) }}
      </BaseBadge>
      <BaseBadge
        v-if="conditionLabel('Refunds', offer.conditions.refund)"
        :tone="offer.conditions.refund?.allowed ? 'success' : 'warning'"
      >
        {{ conditionLabel('Refunds', offer.conditions.refund) }}
      </BaseBadge>
    </section>
  </div>
</template>
