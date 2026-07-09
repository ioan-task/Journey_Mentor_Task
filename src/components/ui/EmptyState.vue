<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string; tone?: 'neutral' | 'error' }>(), {
  description: undefined,
  tone: 'neutral',
})
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-white px-6 py-12 text-center"
    :class="tone === 'error' ? 'border-red-300' : 'border-slate-300'"
  >
    <div v-if="$slots.icon" class="text-slate-400" aria-hidden="true">
      <slot name="icon" />
    </div>
    <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
    <p v-if="description" class="max-w-md text-sm text-slate-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
