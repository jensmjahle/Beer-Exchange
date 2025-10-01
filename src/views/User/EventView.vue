<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getEvent } from '@/services/events.service.js'
import { listEventBeers } from '@/services/beers.service.js'
import { listEventTransactions } from '@/services/transactions.service.js'

import BiggestMovers from '@/components/BiggestMovers.vue'
import PriceGrid from '@/components/PriceGrid.vue'
import TransactionHistory from '@/components/TransactionHistory.vue'
import CustomersPanel from "@/components/CustomersPanel.vue";
import LiveIndicator from "@/components/LiveIndicator.vue";

const route = useRoute()
const eventId = String(route.params.eventId || '')

const loading = ref(true)
const error = ref(null)
const ev = ref(null)
const beers = ref([])
const transactions = ref([])

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [e, b, t] = await Promise.all([
      getEvent(eventId),
      listEventBeers(eventId),
      listEventTransactions(eventId, { limit: 200 }),
    ])
    ev.value = e
    beers.value = Array.isArray(b) ? b : []
    transactions.value = Array.isArray(t) ? t : []
  } catch (e) {
    error.value = e?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

const topWinners = computed(() => [...beers.value].sort((a,b) => (b.current_price ?? 0) - (a.current_price ?? 0)).slice(0,5))
const topLosers  = computed(() => [...beers.value].sort((a,b) => (a.current_price ?? 0) - (b.current_price ?? 0)).slice(0,5))

async function onUpdated() {
  // After a purchase: refresh beers & transactions
  try {
    const [b, t] = await Promise.all([
      listEventBeers(eventId),
      listEventTransactions(eventId, { limit: 200 }),
    ])
    beers.value = Array.isArray(b) ? b : []
    transactions.value = Array.isArray(t) ? t : []
  } catch (e) {
    console.warn('Refresh after buy failed:', e?.message || e)
  }
}

onMounted(loadAll)
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-baseline gap-4">
      <h1 class="text-3xl font-extrabold">{{ ev?.name ?? 'Beer Exchange' }}</h1>
      <LiveIndicator/>
    </header>

    <div v-if="loading" class="p-4 rounded-xl border border-dashed">Loading…</div>

    <div v-else class="space-y-4">
      <div v-if="error" class="p-4 rounded-xl border border-red-300 text-red-700 bg-red-50">
        {{ error }}
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <BiggestMovers title="Biggest Winners" :items="topWinners" side="left" />
        <BiggestMovers title="Biggest Losers" :items="topLosers" side="right" />
      </div>

      <PriceGrid
        :event-id="eventId"
        :beers="beers"
        :currency="ev?.currency ?? 'NOK'"
        @updated="onUpdated"
      />

      <CustomersPanel
        :event-id="eventId"
        :currency="ev?.currency ?? 'NOK'"
      />

      <TransactionHistory
        :transactions="transactions"
        :currency="ev?.currency ?? 'NOK'"
      />
    </div>
  </section>
</template>

