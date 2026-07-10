import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SearchHistoryEntry, SearchParams } from '@/types/domain'
import { loadHistory, saveHistory } from '@/lib/persistence'
import { cloneSearchParams, historyKey } from '@/lib/searchKey'

const MAX_ENTRIES = 10

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<SearchHistoryEntry[]>(loadHistory())

  function record(params: SearchParams): void {
    const key = historyKey(params)
    const next = entries.value.filter((entry) => historyKey(entry.params) !== key)
    next.unshift({ params: cloneSearchParams(params), savedAt: Date.now() })
    entries.value = next.slice(0, MAX_ENTRIES)
    saveHistory(entries.value)
  }

  function clear(): void {
    entries.value = []
    saveHistory([])
  }

  return { entries, record, clear }
})
