<script setup lang="ts">
import { useSearchStore } from '@/stores/searchStore'
import SearchForm from '@/components/search/SearchForm.vue'
import SearchHistoryList from '@/components/search/SearchHistoryList.vue'
import ResultsView from '@/components/results/ResultsView.vue'

// Restore the last search (params, results, filters, sort) before first render
// so a reload comes back exactly where the user left off.
const store = useSearchStore()
store.hydrate()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-4">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-6 text-sky-600"
          aria-hidden="true"
        >
          <path
            d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
          />
        </svg>
        <h1 class="text-lg font-bold text-slate-900">Flight Search</h1>
        <span
          class="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
        >
          Duffel sandbox
        </span>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <SearchForm />
      <SearchHistoryList />
      <div class="mt-6">
        <ResultsView />
      </div>
    </main>

    <footer class="mx-auto w-full max-w-6xl px-4 pb-6">
      <p class="text-xs text-slate-500">
        Test data from the Duffel sandbox — schedules and prices are not real.
      </p>
    </footer>
  </div>
</template>
