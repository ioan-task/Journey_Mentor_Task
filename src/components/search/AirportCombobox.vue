<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PlaceRef } from '@/types/domain'
import { usePlaceSuggestions } from '@/composables/usePlaceSuggestions'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps<{
  id: string
  modelValue: PlaceRef | null
  placeholder?: string
  invalid?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PlaceRef | null]
  blur: []
}>()

function labelOf(place: PlaceRef | null): string {
  return place ? `${place.name} (${place.iataCode})` : ''
}

/** What the input displays; only `query` (typed text) triggers suggestion fetches. */
const inputText = ref(labelOf(props.modelValue))
const query = ref('')
const open = ref(false)
const highlighted = ref(0)

const { suggestions, status } = usePlaceSuggestions(query)

watch(
  () => props.modelValue,
  (value) => {
    // Ignore the null this component emits itself while the user is typing
    // (onInput clears the selection). Only external changes — swap button,
    // history re-run — should overwrite the typed text; those arrive with a
    // place, or while no query is in progress.
    if (value === null && query.value !== '') return
    inputText.value = labelOf(value)
    query.value = ''
  },
)

// A shorter result set must never leave the highlight pointing past the end.
watch(suggestions, () => {
  highlighted.value = 0
})

/** Only true when real options are actually rendered in the listbox. */
const hasOptions = computed(() => status.value === 'success' && suggestions.value.length > 0)
const showPopup = computed(
  () => open.value && query.value.trim().length >= 2 && status.value !== 'idle',
)

const listboxId = computed(() => `${props.id}-listbox`)
const statusId = computed(() => `${props.id}-status`)
const optionId = (index: number) => `${props.id}-option-${index}`
const activeDescendant = computed(() =>
  hasOptions.value && highlighted.value < suggestions.value.length
    ? optionId(highlighted.value)
    : undefined,
)

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  inputText.value = value
  // Typing invalidates the previous selection: the model is only ever a
  // confirmed suggestion, which keeps form validation a simple null check.
  if (props.modelValue) emit('update:modelValue', null)
  query.value = value
  highlighted.value = 0
  open.value = true
}

function select(place: PlaceRef): void {
  emit('update:modelValue', place)
  inputText.value = labelOf(place)
  query.value = ''
  open.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!open.value) {
      if (hasOptions.value) open.value = true
      return
    }
    if (!hasOptions.value) return
    const count = suggestions.value.length
    const step = event.key === 'ArrowDown' ? 1 : -1
    highlighted.value = (highlighted.value + step + count) % count
  } else if (event.key === 'Enter') {
    // Only commit an option that is actually on screen (status === success).
    if (open.value && hasOptions.value && suggestions.value[highlighted.value]) {
      event.preventDefault()
      select(suggestions.value[highlighted.value]!)
    }
  } else if (event.key === 'Escape') {
    if (open.value) {
      open.value = false
      inputText.value = labelOf(props.modelValue) || inputText.value
    }
  } else if (event.key === 'Tab') {
    open.value = false
  }
}

function onBlur(): void {
  open.value = false
  emit('blur')
}
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      role="combobox"
      type="text"
      autocomplete="off"
      spellcheck="false"
      :value="inputText"
      :placeholder="placeholder"
      :aria-expanded="hasOptions && open"
      :aria-controls="listboxId"
      :aria-activedescendant="activeDescendant"
      :aria-invalid="invalid || undefined"
      :aria-describedby="invalid ? `${id}-error` : statusId"
      aria-autocomplete="list"
      class="w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-2 focus:outline-sky-500/40"
      :class="invalid ? 'border-red-400' : 'border-slate-300'"
      @input="onInput"
      @keydown="onKeydown"
      @blur="onBlur"
    />

    <!-- Status messages live outside the listbox so it only ever owns options,
         and are announced politely to assistive tech. -->
    <div
      v-if="showPopup && !hasOptions"
      :id="statusId"
      role="status"
      aria-live="polite"
      class="absolute z-20 mt-1 w-full min-w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
      :class="status === 'error' ? 'text-red-600' : 'text-slate-500'"
    >
      <template v-if="status === 'loading'">Searching…</template>
      <template v-else-if="status === 'error'">
        Couldn't load suggestions. Keep typing to retry.
      </template>
      <template v-else>No matching places.</template>
    </div>

    <ul
      v-if="showPopup && hasOptions"
      :id="listboxId"
      role="listbox"
      class="absolute z-20 mt-1 max-h-72 w-full min-w-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
    >
      <li
        v-for="(place, index) in suggestions"
        :id="optionId(index)"
        :key="`${place.type}-${place.iataCode}`"
        role="option"
        :aria-selected="index === highlighted"
        class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2"
        :class="index === highlighted ? 'bg-sky-50' : 'hover:bg-slate-50'"
        @mousedown.prevent
        @click="select(place)"
        @mousemove="highlighted = index"
      >
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-slate-900">
            {{ place.name }}
            <span class="font-normal text-slate-500">({{ place.iataCode }})</span>
          </span>
          <span class="block truncate text-xs text-slate-500">
            {{ place.type === 'city' ? 'All airports' : (place.cityName ?? 'Airport') }}
          </span>
        </span>
        <BaseBadge :tone="place.type === 'city' ? 'info' : 'neutral'">
          {{ place.type === 'city' ? 'City' : 'Airport' }}
        </BaseBadge>
      </li>
    </ul>
  </div>
</template>
