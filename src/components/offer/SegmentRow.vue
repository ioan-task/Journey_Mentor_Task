<script setup lang="ts">
import { computed } from 'vue'
import type { Segment } from '@/types/domain'
import { dayDiff, timePart } from '@/lib/datetime'
import { formatMinutes } from '@/lib/duration'

const props = defineProps<{ segment: Segment }>()

const arrivalDayOffset = computed(() =>
  dayDiff(props.segment.departingAt, props.segment.arrivingAt),
)

const baggageLabel = computed(() => {
  const parts: string[] = []
  if (props.segment.checkedBags > 0) parts.push(`${props.segment.checkedBags} checked`)
  if (props.segment.carryOnBags > 0) parts.push(`${props.segment.carryOnBags} carry-on`)
  return parts.length > 0 ? `Bags: ${parts.join(', ')}` : 'No baggage included'
})
</script>

<template>
  <div class="flex gap-3">
    <div class="flex flex-col items-center pt-1.5" aria-hidden="true">
      <span class="size-2 rounded-full border-2 border-sky-500"></span>
      <span class="w-px flex-1 bg-slate-200"></span>
      <span class="size-2 rounded-full bg-sky-500"></span>
    </div>
    <div class="min-w-0 flex-1 space-y-1 pb-1">
      <p class="text-sm font-medium text-slate-900">
        {{ timePart(segment.departingAt) }} · {{ segment.originName }}
        <span class="text-slate-500">({{ segment.originIata }})</span>
      </p>
      <p class="text-xs text-slate-500">
        {{ segment.carrierName }}
        <template v-if="segment.flightNumber">
          {{ segment.carrierIata ?? '' }}{{ segment.flightNumber }}
        </template>
        <template v-if="segment.operatingCarrierName">
          · operated by {{ segment.operatingCarrierName }}
        </template>
        <template v-if="segment.aircraftName">· {{ segment.aircraftName }}</template>
        · {{ formatMinutes(segment.durationMinutes) }}
      </p>
      <p class="text-xs text-slate-500">
        <template v-if="segment.cabinName">{{ segment.cabinName }} · </template>
        {{ baggageLabel }}
      </p>
      <p class="text-sm font-medium text-slate-900">
        {{ timePart(segment.arrivingAt) }} · {{ segment.destinationName }}
        <span class="text-slate-500">({{ segment.destinationIata }})</span>
        <sup v-if="arrivalDayOffset > 0" class="text-xs font-medium text-amber-600">
          +{{ arrivalDayOffset }}
        </sup>
      </p>
    </div>
  </div>
</template>
