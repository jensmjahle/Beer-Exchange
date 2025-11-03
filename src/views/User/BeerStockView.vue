<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getEvent } from "@/services/events.service.js";
import {
  getBeerPriceHistory,
  getBeerStats,
} from "@/services/analytics.service.js";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
);

const route = useRoute();
const router = useRouter();
const eventId = String(route.params.eventId || "");
const eventBeerId = String(route.params.eventBeerId || "");

const ev = ref(null);
const loading = ref(true);
const error = ref(null);

const range = ref("day"); // '1h' | '3h' | 'day' | 'all'
const history = ref([]); // [{ts, price}]
const stats = ref(null); // { name, beer_id, ath, atl, first_ts, last_ts, last_price, change_pct_1h/day/all, top_buyers? ... }

// pull color scheme from CSS vars
function getVar(name, fallback = "#3b82f6") {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

const lineColorUp = getVar("--color-success", "#10b981");
const lineColorDown = getVar("--color-danger", "#ef4444");
const gridColor = "rgba(0,0,0,0.08)";

const priceChangePct = computed(() => {
  if (!history.value.length) return 0;
  const first = history.value[0]?.price ?? 0;
  const last = history.value[history.value.length - 1]?.price ?? 0;
  if (!first) return 0;
  return ((last - first) / first) * 100;
});

const chartData = computed(() => {
  const isUp = priceChangePct.value >= 0;
  return {
    labels: history.value.map((p) => p.ts),
    datasets: [
      {
        label: "Price",
        data: history.value.map((p) => p.price),
        borderColor: isUp ? lineColorUp : lineColorDown,
        backgroundColor: (isUp ? lineColorUp : lineColorDown) + "22",
        tension: 0.2,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: "time",
      time: {
        tooltipFormat: "HH:mm:ss",
        displayFormats: { minute: "HH:mm", hour: "HH:mm", day: "MMM d" },
      },
      grid: { color: gridColor },
    },
    y: {
      beginAtZero: false,
      grid: { color: gridColor },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: (ctx) => ` ${ctx.parsed.y?.toFixed?.(1)}`,
      },
    },
  },
};

async function loadAll() {
  loading.value = true;
  error.value = null;
  try {
    const [e, h, s] = await Promise.all([
      getEvent(eventId),
      getBeerPriceHistory(eventId, eventBeerId, range.value),
      getBeerStats(eventId, eventBeerId),
    ]);
    ev.value = e;
    history.value = Array.isArray(h) ? h : [];
    stats.value = s;

    console.log("Loaded beer stock data:", { event: e, history: h, stats: s });
  } catch (err) {
    error.value = err?.message || "Failed to load";
  } finally {
    loading.value = false;
  }
}

watch(range, loadAll);
onMounted(loadAll);

function backToEvent() {
  router.push({ name: "event", params: { eventId } });
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold">Beer Stock</h1>
        <p class="opacity-70 text-sm">
          Event: {{ eventId }} · Beer:
          {{ stats?.name ?? stats?.beer_id ?? eventBeerId }}
        </p>
      </div>
      <button
        class="rounded-lg border px-3 py-1.5 border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
        @click="backToEvent"
      >
        ← Back to Event
      </button>
    </header>

    <div class="flex items-center gap-2">
      <button
        v-for="r in ['1h', '3h', 'day', 'all']"
        :key="r"
        class="rounded-lg px-3 py-1.5 border"
        :class="
          range === r
            ? 'bg-[var(--color-button1)] border-[var(--color-button1-border)]'
            : 'border-[var(--color-border3)] hover:bg-[var(--color-bg4)]'
        "
        @click="range = r"
      >
        {{
          r === "1h"
            ? "Last hour"
            : r === "3h"
              ? "Last 3h"
              : r === "day"
                ? "Today"
                : "All time"
        }}
      </button>
    </div>

    <div v-if="loading" class="rounded-xl border border-dashed p-6">
      Loading…
    </div>
    <div
      v-else-if="error"
      class="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700"
    >
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <div class="h-64 rounded-xl border p-3 bg-[var(--color-button4)]">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-xl border p-4 bg-bg2">
          <div class="text-xs opacity-70">Change ({{ range }})</div>
          <div
            :class="[
              'text-xl font-extrabold',
              priceChangePct >= 0 ? 'text-green-600' : 'text-red-600',
            ]"
          >
            {{ priceChangePct.toFixed(1) }}%
          </div>
        </div>
        <div class="rounded-xl border p-4 bg-bg2">
          <div class="text-xs opacity-70">All-time high</div>
          <div class="text-xl font-extrabold">
            {{ stats?.ath?.toFixed?.(1) ?? "-" }}
          </div>
        </div>
        <div class="rounded-xl border p-4 bg-bg2">
          <div class="text-xs opacity-70">All-time low</div>
          <div class="text-xl font-extrabold">
            {{ stats?.atl?.toFixed?.(1) ?? "-" }}
          </div>
        </div>
        <div class="rounded-xl border p-4 bg-bg2">
          <div class="text-xs opacity-70">Last price</div>
          <div class="text-xl font-extrabold">
            {{ stats?.last_price?.toFixed?.(1) ?? "-" }}
          </div>
        </div>
      </div>
      <div class="rounded-2xl border p-5 bg-bg2">
        <header class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-extrabold">{{ stats.name }}</h2>
          <div
            v-if="stats?.abv"
            class="text-xs px-2 py-1 rounded-full border border-[var(--color-border3)]"
          >
            {{ stats.abv }}% ABV
          </div>
        </header>

        <!-- Description -->
        <p class="text-base leading-relaxed whitespace-pre-line">
          {{ stats?.description || "No description available." }}
        </p>

        <!-- Meta chips -->
        <div class="mt-4 flex flex-wrap gap-2 text-sm">
          <span
            v-if="stats?.brewery"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border4 bg-bg4"
          >
            <span class="opacity-70">Brewery:</span>
            <strong>{{ stats.brewery }}</strong>
          </span>
          <span
            v-if="stats?.style"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border4 bg-bg4"
          >
            <span class="opacity-70">Style:</span>
            <strong>{{ stats.style }}</strong>
          </span>
          <span
            v-if="stats?.ibu != null"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border4 bg-bg4"
          >
            <span class="opacity-70">IBU:</span>
            <strong>{{ stats.ibu }}</strong>
          </span>
          <span
            v-if="stats?.volume_ml"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border4 bg-bg4"
          >
            <span class="opacity-70">Volume:</span>
            <strong>{{ Math.round(stats.volume_ml) }} ml</strong>
          </span>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-xs opacity-70">Cheapest buyer</div>
          <div class="font-bold">
            {{ stats?.cheapest?.customer_name ?? "—" }}
          </div>
          <div class="text-xs opacity-70" v-if="stats?.cheapest">
            paid {{ stats.cheapest.unit_price.toFixed(1) }} (×{{
              stats.cheapest.qty
            }})
          </div>
        </div>
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-xs opacity-70">Most expensive buyer</div>
          <div class="font-bold">
            {{ stats?.priciest?.customer_name ?? "—" }}
          </div>
          <div class="text-xs opacity-70" v-if="stats?.priciest">
            paid {{ stats.priciest.unit_price.toFixed(1) }} (×{{
              stats.priciest.qty
            }})
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
