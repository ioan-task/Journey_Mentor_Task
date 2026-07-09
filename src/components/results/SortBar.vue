<script setup lang="ts">
import type { SortKey } from '@/types/domain'

defineProps<{ modelValue: SortKey }>()
const emit = defineEmits<{ 'update:modelValue': [value: SortKey] }>()

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'price', label: 'Cheapest' },
  { value: 'duration', label: 'Fastest' },
  { value: 'departure', label: 'Earliest' },
]
</script>

<template>
  <!-- Toggle buttons with aria-pressed rather than a radiogroup: native buttons
       keep their expected keyboard behaviour instead of promising (and not
       delivering) roving-tabindex arrow navigation. -->
  <div
    role="group"
    aria-label="Sort results"
    class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
  >
    <button
      v-for="option in OPTIONS"
      :key="option.value"
      type="button"
      :aria-pressed="modelValue === option.value"
      class="rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      :class="
        modelValue === option.value
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-800'
      "
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
