<script setup lang="ts">
defineProps<{
  label: string
  forId: string
  error?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="forId" class="text-xs font-medium text-slate-600">{{ label }}</label>
    <slot />
    <p v-if="error" :id="`${forId}-error`" role="alert" class="text-xs text-red-600">
      {{ error }}
    </p>
  </div>
</template>
