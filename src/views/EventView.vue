<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getEvent } from '@/services/events.service.js'
import { listEventBeers } from '@/services/beers.service.js'
import { listEventTransactions } from '@/services/transactions.service.js'

import BiggestMovers from '@/components/BiggestMovers.vue'
import PriceGrid from '@/components/PriceGrid.vue'
import TransactionHistory from '@/components/TransactionHistory.vue'

const route = useRoute()
const eventId = String(route.params.eventId || '')

// state
const loading = ref(true)
const error = ref(null)
const ev = ref(null)
const beers = ref([])
const transactions = ref([])

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [eRes, bRes, tRes] = await Promise.allSettled([
      getEvent(eventId),
      listEventBeers(eventId),
      listEventTransactions(eventId, { limit: 200 }),
    ])

    if (eRes.status === 'fulfilled') {
      ev.value = eRes.value
    } else {
      error.value = eRes.reason?.message || 'Failed to load event'
    }

    if (bRes.status === 'fulfilled') {
      beers.value = Array.isArray(bRes.value) ? bRes.value : []
    } else {
      console.warn('Beers load failed:', bRes.reason)
      // keep going; UI will still render event header/history if present
    }

    if (tRes.status === 'fulfilled') {
      transactions.value = Array.isArray(tRes.value) ? tRes.value : []
    } else {
      console.warn('Transactions load failed:', tRes.reason)
    }
  } catch (e) {
    console.error('EventView load error:', e)
    error.value = e?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

// Simple “movers” until you compute deltas from price history
const topWinners = computed(() =>
  [...beers.value].sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0)).slice(0, 5)
)
const topLosers = computed(() =>
  [...beers.value].sort((a, b) => (a.current_price ?? 0) - (b.current_price ?? 0)).slice(0, 5)
)

onMounted(loadAll)
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-baseline gap-3">
      <h1 class="text-3xl font-extrabold">{{ ev?.name ?? 'Beer Exchange' }}</h1>
      <p class="text-sm opacity-70">Event: {{ eventId }}</p>
    </header>

    <div v-if="loading" class="p-4 rounded-xl border border-dashed">Loading…</div>

    <div v-else>
      <div v-if="error" class="mb-4 p-4 rounded-xl border border-red-300 text-red-700 bg-red-50">
        {{ error }}
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <BiggestMovers title="Biggest Winners" :items="topWinners" side="left" />
        <BiggestMovers title="Biggest Losers" :items="topLosers" side="right" />
      </div>

      <PriceGrid :beers="beers" :currency="ev?.currency ?? 'NOK'" />

      <TransactionHistory :transactions="transactions" :currency="ev?.currency ?? 'NOK'" />
    </div>
  </section>
</template>
