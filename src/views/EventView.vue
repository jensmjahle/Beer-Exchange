<script setup>
import { useRoute } from 'vue-router'
import { useEventData } from '@/composables/useEventData'
import BiggestMovers from '@/components/BiggestMovers.vue'
import PriceGrid from '@/components/PriceGrid.vue'
import TransactionHistory from '@/components/TransactionHistory.vue'

const route = useRoute()
const eventId = String(route.params.eventId || '')
const data = useEventData(eventId)
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-baseline gap-3">
      <h1 class="text-3xl font-extrabold">Beer Exchange</h1>
      <p class="text-sm opacity-70">Event: {{ eventId }}</p>
    </header>

    <div v-if="data.loading" class="p-4 rounded-xl border border-dashed">
      Loading…
    </div>
    <div v-else-if="data.error" class="p-4 rounded-xl border border-red-300 text-red-700 bg-red-50">
      Error: {{ data.error }}
    </div>
    <div v-else class="space-y-6">
      <div class=
               "grid md:grid-cols-2 gap-4">
        <BiggestMovers title="Biggest Winners" :items="data.topWinners" side="left" />
        <BiggestMovers title="Biggest Losers" :items="data.topLosers" side="right" />
      </div>

      <PriceGrid :beers="data.beers" />

      <TransactionHistory :transactions="data.transactions" />
    </div>
  </section>
</template>
