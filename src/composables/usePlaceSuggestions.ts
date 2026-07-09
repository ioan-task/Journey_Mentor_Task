import { onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { PlaceRef } from '@/types/domain'
import { fetchPlaceSuggestions } from '@/api/duffel/places'
import { isAbortError } from '@/api/http'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

export type SuggestionStatus = 'idle' | 'loading' | 'success' | 'error'

export function usePlaceSuggestions(query: Ref<string>): {
  suggestions: Ref<PlaceRef[]>
  status: Ref<SuggestionStatus>
} {
  const suggestions = ref<PlaceRef[]>([])
  const status = ref<SuggestionStatus>('idle')

  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined

  function cancelPending(): void {
    clearTimeout(timer)
    controller?.abort()
    controller = undefined
  }

  watch(query, (value) => {
    cancelPending()
    const trimmed = value.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      suggestions.value = []
      status.value = 'idle'
      return
    }
    timer = setTimeout(async () => {
      const own = new AbortController()
      controller = own
      // Drop the previous query's results as the new fetch starts, so a stale
      // list can never be shown (or selected) under a newer query's text.
      suggestions.value = []
      status.value = 'loading'
      try {
        const places = await fetchPlaceSuggestions(trimmed, own.signal)
        if (own.signal.aborted) return
        suggestions.value = places
        status.value = 'success'
      } catch (error) {
        if (isAbortError(error) || own.signal.aborted) return
        suggestions.value = []
        status.value = 'error'
      }
    }, DEBOUNCE_MS)
  })

  onScopeDispose(cancelPending)

  return { suggestions, status }
}
