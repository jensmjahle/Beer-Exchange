<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  calculateCustomerBACFromTransactions,
  getBACStatus,
  estimateTimeUntilSober,
} from "@/services/bac.service.js";

const props = defineProps({
  customer: { type: Object, required: true },
  eventId: { type: String, required: true },
  autoRefresh: { type: Boolean, default: true }, // Auto-refresh every minute
  showDetails: { type: Boolean, default: false },
});

const loading = ref(false);
const error = ref(null);
const bacData = ref(null);
const currentTime = ref(new Date());
const lastUpdate = ref(new Date());

// Computed properties for display
const bacStatus = computed(() => {
  if (!bacData.value) return null;
  return getBACStatus(bacData.value.bac);
});

const timeUntilSober = computed(() => {
  if (!bacData.value || bacData.value.bac === 0 || isNaN(bacData.value.bac))
    return null;
  const hours = estimateTimeUntilSober(bacData.value.bac);
  if (isNaN(hours)) return null;

  const hoursWhole = Math.floor(hours);
  const minutes = Math.round((hours - hoursWhole) * 60);

  if (hoursWhole === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hoursWhole}h`;
  } else {
    return `${hoursWhole}h ${minutes}m`;
  }
});

const bacPercentage = computed(() => {
  if (!bacData.value || isNaN(bacData.value.bac)) return "0.00";
  // Convert percentage to promille (multiply by 10)
  const promille = bacData.value.bac * 10;
  return promille.toFixed(2);
});

async function calculateBAC() {
  if (!props.customer || !props.eventId) return;

  loading.value = true;
  error.value = null;

  // Always use the current time for accurate calculations
  const now = new Date();
  currentTime.value = now;

  console.log("Calculating BAC at time:", now.toISOString());

  try {
    bacData.value = await calculateCustomerBACFromTransactions(
      props.customer,
      props.eventId,
      now, // Pass current time explicitly
    );

    if (bacData.value.error) {
      error.value = bacData.value.error;
    }

    console.log("BAC calculation completed:", {
      bac: bacData.value.bac,
      hoursSinceFirstDrink: bacData.value.hoursSinceFirstDrink,
      currentTime: now.toISOString(),
    });

    // Update last update time
    lastUpdate.value = now;
  } catch (e) {
    error.value = e.message || "Failed to calculate BAC";
    console.error("BAC calculation error:", e);
  } finally {
    loading.value = false;
  }
}

// Auto-refresh functionality
let refreshInterval = null;

function startAutoRefresh() {
  if (!props.autoRefresh) return;

  console.log("Starting BAC auto-refresh (every 30 seconds)");

  // Update current time and recalculate BAC every 30 seconds for testing
  refreshInterval = setInterval(() => {
    console.log("Auto-refreshing BAC at:", new Date().toISOString());
    calculateBAC(); // This will set currentTime.value inside the function
  }, 30000); // 30 seconds for faster testing
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Watchers
watch(
  () => props.autoRefresh,
  (newVal) => {
    if (newVal) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  },
);

watch(
  () => [props.customer, props.eventId],
  () => {
    calculateBAC();
  },
  { deep: true },
);

// Lifecycle
onMounted(() => {
  calculateBAC();
  if (props.autoRefresh) {
    startAutoRefresh();
  }
});

// Cleanup
import { onUnmounted } from "vue";
onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="bac-display">
    <div v-if="loading" class="flex items-center justify-center p-4">
      <div class="text-sm opacity-70">Calculating BAC...</div>
    </div>

    <div
      v-else-if="error"
      class="p-3 bg-red-100 text-red-700 rounded-lg text-sm"
    >
      ⚠️ BAC Error: {{ error }}
    </div>

    <div v-else-if="bacData" class="space-y-3">
      <!-- Main BAC Display -->
      <div
        class="text-center p-4 rounded-lg border-2 transition-colors"
        :class="{
          'bg-green-50 border-green-200':
            bacStatus?.level === 'sober' || bacStatus?.level === 'minimal',
          'bg-yellow-50 border-yellow-200': bacStatus?.level === 'light',
          'bg-orange-50 border-orange-200': bacStatus?.level === 'moderate',
          'bg-red-50 border-red-200': bacStatus?.level === 'high',
          'bg-red-100 border-red-300': bacStatus?.level === 'severe',
        }"
      >
        <div
          class="text-3xl font-bold mb-1"
          :style="{ color: bacStatus?.color }"
        >
          {{ bacPercentage }}‰
        </div>
        <div class="text-sm font-medium mb-1">
          {{ bacStatus?.message }}
        </div>
        <div v-if="!bacStatus?.canDrive" class="text-xs opacity-70">
          🚫 Cannot drive
        </div>
        <div v-else class="text-xs opacity-70">✅ Can drive</div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="bg-bg3 p-2 rounded">
          <div class="font-medium">Drinks</div>
          <div>{{ bacData.totalDrinks || 0 }}</div>
        </div>
        <div class="bg-bg3 p-2 rounded">
          <div class="font-medium">Time drinking</div>
          <div>
            {{
              isNaN(bacData.hoursSinceFirstDrink)
                ? "0"
                : bacData.hoursSinceFirstDrink
            }}h
          </div>
        </div>
      </div>

      <!-- Time until sober -->
      <div v-if="timeUntilSober" class="text-center text-sm bg-bg3 p-2 rounded">
        ⏱️ Sober in: <strong>{{ timeUntilSober }}</strong>
      </div>

      <!-- Detailed breakdown (optional) -->
      <div v-if="showDetails" class="mt-4 space-y-2">
        <h4 class="font-medium text-sm">Detailed Information</h4>

        <div class="text-xs space-y-1 bg-bg3 p-3 rounded">
          <div>
            <strong>Weight:</strong> {{ bacData.weightKg || "Unknown" }} kg
          </div>
          <div><strong>Gender:</strong> {{ bacData.gender || "Unknown" }}</div>
          <div>
            <strong>Total alcohol:</strong>
            {{
              isNaN(bacData.totalAlcoholGrams)
                ? "0"
                : bacData.totalAlcoholGrams
            }}g
          </div>
          <div>
            <strong>Transactions:</strong>
            {{ bacData.transactions?.length || 0 }}
          </div>
        </div>

        <!-- Beer breakdown -->
        <div v-if="bacData.beerDetails?.length" class="text-xs">
          <div class="font-medium mb-1">Beer Breakdown:</div>
          <div class="space-y-1">
            <div
              v-for="(detail, index) in bacData.beerDetails"
              :key="index"
              class="flex justify-between bg-bg3 p-2 rounded"
            >
              <span>
                {{ detail.transaction.qty }}× {{ detail.beer?.name || "Beer" }}
                <span v-if="detail.beer?.abv" class="opacity-70">
                  ({{ detail.beer.abv }}%)
                </span>
              </span>
              <span>{{ detail.totalAlcoholGrams.toFixed(1) }}g</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Refresh info -->
      <div v-if="autoRefresh" class="text-xs text-center opacity-50">
        🔄 Auto-updating every 30 seconds
        <br />
        Last update: {{ lastUpdate.toLocaleTimeString() }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.bac-display {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
</style>
