<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { listEventCustomers } from "@/services/customers.service.js";
import { listEventBeers } from "@/services/beers.service.js";
import BACDisplay from "@/components/BACDisplay.vue";
import BACMini from "@/components/BACMini.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseDropdown from "@/components/base/BaseDropdown.vue";

const route = useRoute();
const eventId = String(route.params.eventId || "");

const customers = ref([]);
const beers = ref([]);
const selectedCustomerId = ref("");
const loading = ref(true);
const error = ref(null);

const selectedCustomer = computed(() => {
  return customers.value.find((c) => c.id === selectedCustomerId.value) || null;
});

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const [customerData, beerData] = await Promise.all([
      listEventCustomers(eventId),
      listEventBeers(eventId),
    ]);
    customers.value = customerData;
    beers.value = beerData;

    // Auto-select first customer if available
    if (customers.value.length > 0 && !selectedCustomerId.value) {
      selectedCustomerId.value = customers.value[0].id;
    }
  } catch (e) {
    error.value = e.message || "Failed to load data";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">🍺 BAC Calculator Demo</h1>

    <div v-if="loading" class="text-center py-8">Loading event data...</div>

    <div v-else-if="error" class="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
      ❌ {{ error }}
    </div>

    <div v-else class="space-y-6">
      <!-- Customer Selector -->
      <div class="bg-bg2 p-4 rounded-lg">
        <h2 class="text-lg font-bold mb-3">Select Customer</h2>
        <BaseDropdown v-model="selectedCustomerId" class="w-full max-w-md">
          <option value="">— Select a customer —</option>
          <option
            v-for="customer in customers"
            :key="customer.id"
            :value="customer.id"
          >
            {{ customer.name }} ({{ customer.gender }}, {{ customer.weight }}kg)
          </option>
        </BaseDropdown>
      </div>

      <!-- BAC Display -->
      <div
        v-if="selectedCustomer"
        class="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <!-- Full BAC Display -->
        <div class="bg-bg2 p-4 rounded-lg">
          <h2 class="text-lg font-bold mb-3">Full BAC Display</h2>
          <BACDisplay
            :customer="selectedCustomer"
            :event-id="eventId"
            :auto-refresh="true"
            :show-details="true"
          />
        </div>

        <!-- Customer Info + Mini BAC Examples -->
        <div class="space-y-4">
          <!-- Customer Info Card -->
          <div class="bg-bg2 p-4 rounded-lg">
            <h3 class="text-lg font-bold mb-3">Customer Info</h3>
            <div class="flex items-center gap-4 mb-3">
              <img
                v-if="selectedCustomer.profile_image_url"
                :src="selectedCustomer.profile_image_url"
                alt="Profile"
                class="w-16 h-16 rounded-full object-cover border"
              />
              <div
                v-else
                class="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-lg font-bold text-white"
              >
                {{ selectedCustomer.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h4 class="font-bold">{{ selectedCustomer.name }}</h4>
                <p class="text-sm opacity-70">
                  {{ selectedCustomer.sexual_orientation }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Weight:</strong> {{ selectedCustomer.weight }}kg
              </div>
              <div><strong>Gender:</strong> {{ selectedCustomer.gender }}</div>
              <div>
                <strong>Phone:</strong> {{ selectedCustomer.phone || "—" }}
              </div>
              <div>
                <strong>Work:</strong>
                {{ selectedCustomer.work_relationship || "—" }}
              </div>
            </div>
          </div>

          <!-- Mini BAC Examples -->
          <div class="bg-bg2 p-4 rounded-lg">
            <h3 class="text-lg font-bold mb-3">Mini BAC Indicators</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-2 bg-bg3 rounded">
                <span>Mini size:</span>
                <BACMini
                  :customer="selectedCustomer"
                  :event-id="eventId"
                  size="mini"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-bg3 rounded">
                <span>Small size:</span>
                <BACMini
                  :customer="selectedCustomer"
                  :event-id="eventId"
                  size="small"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-bg3 rounded">
                <span>Medium size:</span>
                <BACMini
                  :customer="selectedCustomer"
                  :event-id="eventId"
                  size="medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Beers Info -->
      <div v-if="beers.length" class="bg-bg2 p-4 rounded-lg">
        <h2 class="text-lg font-bold mb-3">
          Available Beers ({{ beers.length }})*
        </h2>
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm"
        >
          <div
            v-for="beer in beers.slice(0, 6)"
            :key="beer.id"
            class="bg-bg3 p-3 rounded"
          >
            <div class="font-medium">{{ beer.name || beer.beer_id }}</div>
            <div class="text-xs opacity-70">
              Price: {{ beer.current_price }} NOK
              <span v-if="beer.abv"> • ABV: {{ beer.abv }}%</span>
              <span v-if="beer.volume_ml"> • {{ beer.volume_ml }}ml</span>
            </div>
          </div>
        </div>
        <p class="text-xs opacity-60 mt-3">
          *BAC calculations use actual ABV/volume data when available, otherwise
          defaults to standard drink equivalents (12g alcohol).
        </p>
      </div>

      <!-- Instructions -->
      <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 class="font-bold mb-2">ℹ️ How to Use</h3>
        <ul class="text-sm space-y-1 list-disc list-inside">
          <li>Select a customer from the dropdown above</li>
          <li>
            The BAC will be calculated based on their actual beer transactions
          </li>
          <li>
            BAC is shown in promille (‰) - Norwegian standard (0.5‰ = 0.05%)
          </li>
          <li>
            BAC updates automatically every minute to account for alcohol
            elimination
          </li>
          <li>
            Color coding: Green (safe), Yellow (caution), Orange/Red (impaired)
          </li>
          <li>
            Norwegian legal limit for driving is 0.2‰ (0.5‰ for serious offense)
          </li>
          <li>Purchase more beers to see BAC increase in real-time</li>
        </ul>
      </div>
    </div>
  </div>
</template>
