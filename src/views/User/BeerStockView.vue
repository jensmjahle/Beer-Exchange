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
import { formatTime } from "../../utils/formatters.js";

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
const beerId = String(route.params.eventBeerId || "");

const ev = ref(null);
const loading = ref(true);
const error = ref(null);

const range = ref("day");
const history = ref([]);
const stats = ref(null);

function getVar(name, fallback = "#3b82f6") {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

const lineColorUp = getVar("--color-success", "#10b981");
const lineColorDown = getVar("--color-danger", "#ef4444");
const gridColor = "rgba(255,255,255,0.08)";

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
        tension: 0.25,
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
        label: (ctx) => ` ${ctx.parsed.y?.toFixed?.(1)} NOK`,
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
      getBeerPriceHistory(eventId, beerId, range.value),
      getBeerStats(eventId, beerId),
    ]);
    ev.value = e;
    history.value = Array.isArray(h) ? h : [];
    stats.value = s;
    console.log(e, h, s);
  } catch (err) {
    console.error(err);
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
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-text1">
          {{ stats?.name ?? beerId }}
        </h1>
        <p class="opacity-70 text-sm text-text2">
          Event: {{ ev?.name ?? "—" }}
        </p>
      </div>
      <button
        class="rounded-lg border px-3 py-1.5 border-border2 hover:bg-bg3"
        @click="backToEvent"
      >
        ← Back to Event
      </button>
    </header>

    <!-- Range selector -->
    <div class="flex items-center gap-2">
      <button
        v-for="r in ['1h', '3h', 'day', 'all']"
        :key="r"
        class="rounded-lg px-3 py-1.5 border text-sm"
        :class="
          range === r
            ? 'bg-button2 border-button2 text-button2-meta'
            : 'border-border2 text-text2 hover:bg-bg3'
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

    <!-- Loading / error -->
    <div v-if="loading" class="rounded-xl border border-dashed p-6 text-text2">
      Loading…
    </div>
    <div
      v-else-if="error"
      class="rounded-xl border border-red-400 bg-red-50 p-6 text-red-700"
    >
      {{ error }}
    </div>

    <!-- MAIN CONTENT -->
    <div v-else class="space-y-6">
      <!-- 📈 PRICE CHART -->
      <div class="h-64 rounded-xl border border-border2 p-3 bg-bg2">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <!-- SUMMARY STATS -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-xl border border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">Change ({{ range }})</div>
          <div
            :class="[
              'text-xl font-extrabold',
              priceChangePct >= 0 ? 'text-green-500' : 'text-red-500',
            ]"
          >
            {{ priceChangePct.toFixed(1) }}%
          </div>
        </div>
        <div class="rounded-xl border border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">All-time high</div>
          <div class="text-xl font-extrabold text-text1">
            {{ stats?.ath?.toFixed?.(1) ?? "-" }} {{ ev.currency }}/L
          </div>
        </div>
        <div class="rounded-xl border border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">All-time low</div>
          <div class="text-xl font-extrabold text-text1">
            {{ stats?.atl?.toFixed?.(1) ?? "-" }} {{ ev.currency }}/L
          </div>
        </div>
        <div class="rounded-xl border border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">Nåværende pris</div>
          <div class="text-xl font-extrabold text-text1">
            {{ stats?.current_price?.toFixed?.(1) ?? "-" }} {{ ev.currency }}/L
          </div>
        </div>
      </div>

      <!-- 📊 BEER DETAILS -->
      <div class="rounded-2xl border border-border2 p-5 gap-4 bg-bg2">
        <header class="flex flex-col items-baseline mb-3">
          <h2 class="text-xl font-extrabold text-text1">{{ stats.name }}</h2>
          <p class="opacity-70">{{ stats.brewery }}</p>
        </header>
        <p>{{ stats.description }}</p>
        <div class="flex flex-row gap-2 mt-3">
          <p class="bg-bg3 border-border3 border text-text3 rounded-2xl p-2">
            {{ stats.abv }} % ABV
          </p>
          <p
            v-if="stats.ibu !== 0"
            class="bg-bg3 border-border3 border text-text3 rounded-2xl p-2"
          >
            {{ stats.ibu }} IBU
          </p>
          <p class="bg-bg3 border-border3 border text-text3 rounded-2xl p-2">
            {{ stats.style }}
          </p>
          <template v-if="stats.volumes && stats.volumes.length">
            <p
              v-for="(v, i) in stats.volumes"
              :key="i"
              class="bg-bg3 border border-border3 text-text3 rounded-2xl p-2"
            >
              {{ v.volume_ml }} ML
            </p>
          </template>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-xl border flex flex-col border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">Beste kjøp</div>
          <div>
            <p class="text-xl font-extrabold text-text1">
              {{ stats.best_trade?.price?.toFixed(1) ?? "-" }}
              {{ ev.currency }}/L
            </p>
            <p>
              {{
                stats.best_trade?.customer
                  ? `Av ${stats.best_trade.customer}`
                  : ""
              }}
              • Kl. {{ formatTime(stats.best_trade?.ts) }}
            </p>
          </div>
        </div>
        <div class="rounded-xl border border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">Verste kjøp</div>
          <div>
            <p class="text-xl font-extrabold text-text1">
              {{ stats.worst_trade?.price?.toFixed(1) ?? "-" }}
              {{ ev.currency }}/L
            </p>
            <p>
              {{
                stats.worst_trade?.customer
                  ? `Av ${stats.worst_trade.customer}`
                  : ""
              }}
              • Kl. {{ formatTime(stats.worst_trade?.ts) }}
            </p>
          </div>
        </div>
        <div class="rounded-xl border border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">Totalt solgte enheter</div>
          <div class="text-xl font-extrabold text-text1">
            {{ stats?.total_sold ?? "-" }} stk
          </div>
        </div>
        <div class="rounded-xl border border-border2 p-4 bg-bg2">
          <div class="text-xs opacity-70 text-text2">Gjennomsnitlig pris</div>
          <div class="text-xl font-extrabold text-text1">
            {{ stats?.avg_price != null ? stats.avg_price.toFixed(1) : "-" }}
            {{ ev.currency }}/L
          </div>
        </div>
      </div>

      <!-- 🏆 TOP CUSTOMERS -->
      <div class="rounded-xl border border-border2 p-5 bg-bg2">
        <h2 class="text-lg font-extrabold mb-2 text-text1">Top Customers 🍻</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-text2 border-b border-border2">
              <th class="py-1 text-left">#</th>
              <th>Customer</th>
              <th>Beers</th>
              <th>Spent</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(c, i) in stats.top_customers || []"
              :key="i"
              class="border-t border-border2"
            >
              <td>{{ i + 1 }}</td>
              <td>{{ c.customer }}</td>
              <td>{{ c.total_qty }}</td>
              <td>{{ c.total_spent.toFixed(1) }} NOK</td>
            </tr>
            <tr v-if="!stats.top_customers?.length">
              <td colspan="4" class="text-center py-2 opacity-70">
                No customers yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 🔁 RECENT TRADES -->
      <div class="rounded-xl border border-border2 p-5 bg-bg2">
        <h2 class="text-lg font-extrabold mb-2 text-text1">Recent Trades 🧾</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-text2 border-b border-border2">
              <th>Customer</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(t, i) in stats.recent_trades || []"
              :key="i"
              class="border-t border-border2"
            >
              <td>{{ t.customer }}</td>
              <td>{{ t.price.toFixed(2) }} NOK</td>
              <td>{{ t.qty }}</td>
              <td>{{ new Date(t.ts).toLocaleString() }}</td>
            </tr>
            <tr v-if="!stats.recent_trades?.length">
              <td colspan="4" class="text-center py-2 opacity-70">No trades</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
