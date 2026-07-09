<script setup lang="ts">
const toneClasses = {
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-sky-100 text-sky-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
} as const

withDefaults(defineProps<{ tone?: keyof typeof toneClasses }>(), { tone: 'neutral' })
</script>

<template>
  <span
    class="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
    :class="toneClasses[tone]"
  >
    <slot />
  </span>
</template>
