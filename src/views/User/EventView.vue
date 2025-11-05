<script setup>
import {ref, computed, onMounted, onUnmounted, onUpdated} from "vue";
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
import { connectLive, off, on } from "@/services/live.service.js";

const route = useRoute();
const eventId = String(route.params.eventId || "");

const loading = ref(true);
const error = ref(null);
const ev = ref(null);
const beers = ref([]);
const transactions = ref([]);
const biggestWinners = ref([]);
const biggestLosers = ref([]);
let eventSource;

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

    const sorted = [...beers.value].sort(
      (a, b) => (b.last_hours_change ?? 0) - (a.last_hours_change ?? 0),
    );

    console.log("Beer sorting:", sorted);
    biggestWinners.value = sorted.slice(0, 3);
    biggestLosers.value = sorted.slice(-3).reverse();
    console.log("Loaded event data:", { event: e, beers: b, transactions: t });
  } catch (e) {
    error.value = e?.message || "Failed to load";
  } finally {
    loading.value = false;
  }
}
function recomputeMovers() {
  const sorted = [...beers.value].sort(
    (a, b) => (b.last_hours_change ?? 0) - (a.last_hours_change ?? 0),
  );
  biggestWinners.value = sorted.slice(0, 3);
  biggestLosers.value = sorted.slice(-3).reverse();
}
const handlePriceUpdate = async () => {
  const updated = await listEventBeers(eventId);
  beers.value.splice(0, beers.value.length, ...updated);
  recomputeMovers();
};

const today = new Date();
const formattedDate = today.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

onMounted(async () => {
  await loadAll();
  await connectLive(eventId);
});

on("priceUpdate", handlePriceUpdate);
onUnmounted(() => off("priceUpdate", handlePriceUpdate));
</script>

<template class="p-4">
  <section class="flex flex-col space-y-6">
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
          title="Største vinnere siste timen"
          :currency="ev?.currency ?? 'NOK'"
          :items="biggestWinners"
        />
        <BiggestMovers
          title="Største tapere siste timen"
          :currency="ev?.currency ?? 'NOK'"
          :items="biggestLosers"
        />
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
        class="max-h-[100vh] overflow-y-hidden"
      />
    </div>
  </section>
</template>
