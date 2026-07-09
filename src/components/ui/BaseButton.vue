<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost'
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', type: 'button' },
)
</script>

<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
    :class="
      variant === 'primary'
        ? 'bg-sky-600 text-white hover:bg-sky-700'
        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
    "
  >
    <slot />
  </button>
</template>
