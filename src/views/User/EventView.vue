<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { getEvent } from "@/services/events.service.js";
import { listEventBeers } from "@/services/beers.service.js";
import {
  listTransactions,
  createTransaction,
} from "@/services/transactions.service.js";

import BiggestMovers from "@/components/BiggestMovers.vue";
import PriceGrid from "@/components/PriceGrid.vue";
import TransactionHistory from "@/components/TransactionHistory.vue";
import CustomersPanel from "@/components/CustomersPanel.vue";
import LiveIndicator from "@/components/LiveIndicator.vue";
import SettingsWidget from "@/components/settings/SettingsWidget.vue";

const route = useRoute();
const eventId = String(route.params.eventId || "");

const loading = ref(true);
const error = ref(null);
const ev = ref(null);
const beers = ref([]);
const transactions = ref([]);
let eventSource;

function connectLive() {
  if (eventSource) return;
  eventSource = new EventSource(
    `${import.meta.env.VITE_API_BASE}/api/live/events/${eventId}/stream`,
  );

  eventSource.addEventListener("transactionUpdate", (e) => {
    const tx = JSON.parse(e.data);
    console.log("[LIVE] transactionUpdate", tx);
    // Prepend to list so newest shows first
    transactions.value.unshift(tx);
  });

  eventSource.addEventListener("priceUpdate", (e) => {
    console.log("[LIVE] priceUpdate", e.data);
    // you already handle this for beers
    refreshBeers();
  });

  eventSource.onerror = (err) => console.warn("[LIVE] error", err);
}

async function loadAll() {
  loading.value = true;
  error.value = null;
  try {
    const [e, b, t] = await Promise.all([
      getEvent(eventId),
      listEventBeers(eventId),
      listTransactions(eventId, { limit: 200 }),
    ]);
    ev.value = e;
    beers.value = Array.isArray(b) ? b : [];
    transactions.value = Array.isArray(t) ? t : [];
  } catch (e) {
    error.value = e?.message || "Failed to load";
  } finally {
    loading.value = false;
  }
}

const topWinners = computed(() =>
  [...beers.value]
    .sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0))
    .slice(0, 5),
);
const topLosers = computed(() =>
  [...beers.value]
    .sort((a, b) => (a.current_price ?? 0) - (b.current_price ?? 0))
    .slice(0, 5),
);

async function onUpdated() {
  // After a purchase: refresh beers & transactions
  try {
    const [b, t] = await Promise.all([
      listEventBeers(eventId),
      listTransactions(eventId, { limit: 200 }),
    ]);
    beers.value = Array.isArray(b) ? b : [];
    transactions.value = Array.isArray(t) ? t : [];
  } catch (e) {
    console.warn("Refresh after buy failed:", e?.message || e);
  }
}
const today = new Date();
const formattedDate = today.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
onMounted(loadAll);
onMounted(connectLive);

onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
});
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-baseline justify-between">
      <div class="flex flex-col items-center gap-4">
        <h1 class="text-3xl font-extrabold">
          {{ ev?.name ?? "Beer Exchange" }}
        </h1>
        <div class="flex flex-row items-center gap-2">
          <LiveIndicator />
          <span class="text-sm opacity-70">{{ formattedDate }}</span>
        </div>
      </div>

      <SettingsWidget />
    </header>

    <div v-if="loading" class="p-4 rounded-xl border border-dashed">
      Loading…
    </div>

    <div v-else class="space-y-4">
      <div
        v-if="error"
        class="p-4 rounded-xl border border-red-300 text-red-700 bg-red-50"
      >
        {{ error }}
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <BiggestMovers
          title="Biggest Winners"
          :items="topWinners"
          side="left"
        />
        <BiggestMovers title="Biggest Losers" :items="topLosers" side="right" />
      </div>

      <PriceGrid
        :event-id="eventId"
        :beers="beers"
        :currency="ev?.currency ?? 'NOK'"
        @updated="onUpdated"
      />

      <CustomersPanel :event-id="eventId" :currency="ev?.currency ?? 'NOK'" />

      <TransactionHistory
        :event-id="eventId"
        :currency="ev?.currency ?? 'NOK'"
      />
    </div>
  </section>
</template>
