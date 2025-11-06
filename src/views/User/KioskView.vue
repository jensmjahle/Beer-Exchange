<template>
  <div
    class="flex flex-row h-screen w-screen overflow-hidden bg-bg1 p-6 gap-6 text-text1 divide-border1/10"
  >
    <section class="flex flex-[3] flex-col items-center gap-6 justify-center">
      <slot name="right">
        <div
          class="flex flex-[1] flex-col items-center text-center justify-center"
        >
          <h1 class="text-4xl md:text-6xl font-bold">
            {{ ev?.name ?? "Beer Exchange" }}
          </h1>
        </div>
        <div
          class="flex flex-[8] flex-row w-full items-start justify-start gap-6"
        >
          <div
            class="flex flex-[1] flex-col w-full items-center justify-center gap-6"
          >
            <BeerList
              title="Øl på børsen"
              :beers="beers"
              :currency="ev?.currency ?? 'NOK'"
              class="w-full"
            />
            <div class="flex flex-col items-center justify-around text-center">
              <h3 class="italic text-lg">
                Bli med på
                <a
                  href="https://beer.jensmartin.no"
                  target="_blank"
                  class="underline hover:text-blue-600"
                >
                  https://beer.jensmartin.no
                </a>
              </h3>
              <img
                :src="qrCode"
                alt="QR Code"
                class="w-54 h-54 md:w-64 md:h-64 rounded-lg"
              />
            </div>
          </div>
          <div
            class="flex flex-[1] flex-col w-full items-center justify-start gap-6"
          >
            <div class="grid md:grid-cols-2 w-full gap-4">
              <BiggestMoversKiosk
                title="Vinnere siste timen"
                :currency="ev?.currency ?? 'NOK'"
                :items="biggestWinners"
              />
              <BiggestMoversKiosk
                title="Tapere siste timen"
                :currency="ev?.currency ?? 'NOK'"
                :items="biggestLosers"
              />
            </div>
            <TransactionHistoryKiosk
              :event-id="eventId"
              :currency="ev?.currency ?? 'NOK'"
              class="flex w-full max-h-[50vh] overflow-y-hidden"
            />
          </div>
        </div>
      </slot>
    </section>

    <section class="flex flex-col flex-[1] items-center justify-between">
      <slot name="left">
        <Podium
  title="Mest væske konsumert"
  unit="L"
  :entries="podiums.volume"
/>
<Podium
  title="Høyest barregning"
  unit="NOK"
  :entries="podiums.spend"
/>
<Podium
  title="Top 3 fyllesvin"
  unit="‰"
  :entries="podiums.bac"
/>

      </slot>
    </section>
  </div>
</template>

<script setup>
import LiveIndicator from "@/components/LiveIndicator.vue";
import { onMounted, onUnmounted, ref } from "vue";
import { getEvent } from "@/services/events.service.js";
import { useRoute } from "vue-router";
import Podium from "@/components/Podium.vue";
import qrCode from "@/assets/qr_code.png";
import BiggestMovers from "@/components/BiggestMovers.vue";
import { connectLive, off, on } from "@/services/live.service.js";
import { listEventBeers } from "@/services/beers.service.js";
import { listTransactions } from "@/services/transactions.service.js";
import TransactionHistory from "@/components/TransactionHistory.vue";
import BeerList from "@/components/BeerList.vue";
import BiggestMoversKiosk from "@/components/BiggestMoversKiosk.vue";
import TransactionHistoryKiosk from "@/components/TransactionHistoryKiosk.vue";
import {getAllPodiums} from "@/services/leaderboard.service.js";
const route = useRoute();
const ev = ref(null);
const eventId = String(route.params.eventId || "");
const beers = ref([]);
const transactions = ref([]);
const biggestWinners = ref([]);
const biggestLosers = ref([]);
const error = ref(null);
const loading = ref(true);
const podiums = ref({ volume: [], spend: [], bac: [] });
async function loadAll() {
  loading.value = true;
  error.value = null;
  try {
    const [e, b, t, p] = await Promise.all([
      getEvent(eventId),
      listEventBeers(eventId),
      listTransactions(eventId),
      getAllPodiums(eventId)
    ]);
    ev.value = e;
    beers.value = Array.isArray(b) ? b : [];
    transactions.value = Array.isArray(t) ? t : [];
    podiums.value = p;

    const sorted = [...beers.value].sort(
      (a, b) => (b.last_hours_change ?? 0) - (a.last_hours_change ?? 0),
    );

    biggestWinners.value = sorted.slice(0, 3);
    biggestLosers.value = sorted.slice(-3).reverse();
    console.log("Loaded event data:", { event: e, beers: b, transactions: t , podiums: p});
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

onMounted(async () => {
  await loadAll();
  await connectLive(eventId);
});
on("priceUpdate", handlePriceUpdate);
onUnmounted(() => off("priceUpdate", handlePriceUpdate));
</script>
