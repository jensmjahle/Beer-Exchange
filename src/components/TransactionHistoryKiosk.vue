<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { connectLive, on, off } from "@/services/live.service.js";
import { listTransactions } from "@/services/transactions.service.js";
import { formatTime } from "@/utils/formatters.js";

const props = defineProps({
  eventId: { type: String, required: true },
  currency: { type: String, default: "NOK" },
});

const transactions = ref([]);

async function getTransactions() {
  try {
    transactions.value = await listTransactions(props.eventId);
    console.log("Loaded transactions:", transactions.value);
  } catch (err) {
    console.error("Failed to load transactions:", err);
    transactions.value = [];
  }
}

onMounted(() => {
  connectLive(props.eventId);
  getTransactions();
  on("priceUpdate", getTransactions);
});

onUnmounted(() => {
  off("priceUpdate", getTransactions);
});
function money(n) {
  if (n == null || Number.isNaN(n)) return "";
  return Number(n).toFixed(1);
}
</script>

<template>
  <div class="flex flex-col rounded-2xl border border-border2 p-4 bg-bg2">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-4xl">Nylige Transaksjoner</h2>
      <span class="text-lg opacity-70">{{ transactions.length }}</span>
    </div>

    <ul class="divide-y">
      <li
        v-for="t in transactions"
        :key="t.id"
        class="py-2 flex items-center justify-between gap-3"
      >
        <div class="min-w-0">
          <div class="font-medium text-xl truncate">
            {{ t.customer_name ?? "Anonymous" }} kjøpte {{ t.qty }} ×
            {{ t.beer_name ?? t.beer_id }}
            {{ t.volume_ml ? `(${t.volume_ml}ml)` : "" }}
          </div>
          <div class="text-lg opacity-70">Kl. {{ formatTime(t.ts) }}</div>
        </div>
        <div class="text-right">
          <div class="font-bold text-2xl tabular-nums">
            {{ money(t.unit_price) }} {{ currency }}
          </div>
          <div class="text-lg opacity-70">
            Totalt {{ money((t.unit_price || 0) * (t.qty || 0)) }}
            {{ currency }}
          </div>
        </div>
      </li>

      <li v-if="!transactions.length" class="py-3 text-sm opacity-60 italic">
        No trades yet
      </li>
    </ul>
  </div>
</template>
