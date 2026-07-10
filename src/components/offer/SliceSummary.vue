<script setup lang="ts">
import { computed } from 'vue'
import type { Slice } from '@/types/domain'
import { dayDiff, timePart } from '@/lib/datetime'
import { formatMinutes } from '@/lib/duration'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps<{ slice: Slice }>()

const arrivalDayOffset = computed(() => dayDiff(props.slice.departingAt, props.slice.arrivingAt))
const stopsLabel = computed(() => {
  if (props.slice.stops === 0) return 'Nonstop'
  return props.slice.stops === 1 ? '1 stop' : `${props.slice.stops} stops`
})
</script>

<template>
  <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
    <p class="text-base font-semibold text-slate-900">
      {{ timePart(slice.departingAt) }} – {{ timePart(slice.arrivingAt) }}
      <sup v-if="arrivalDayOffset > 0" class="text-xs font-medium text-amber-600">
        +{{ arrivalDayOffset }}
      </sup>
    </p>
    <p class="text-sm text-slate-500">{{ slice.originIata }} → {{ slice.destinationIata }}</p>
    <p class="text-sm text-slate-500">{{ formatMinutes(slice.durationMinutes) }}</p>
    <BaseBadge :tone="slice.stops === 0 ? 'success' : 'neutral'">{{ stopsLabel }}</BaseBadge>
  </div>
</template>
