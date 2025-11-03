<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCustomerDetails } from "@/services/customers.service.js";
import BaseButton from "@/components/base/BaseButton.vue";
import BACDisplay from "@/components/BACDisplay.vue";

const props = defineProps({
  eventId: { type: String, required: true },
  customerId: { type: String, required: true },
  currency: { type: String, default: "NOK" },
});

const route = useRoute();
const router = useRouter();
const eventId = String(route.query.eventId || route.params.eventId || "");
const customerId = String(route.params.customerId || "");

const loading = ref(true);
const error = ref(null);
const details = ref(null);

async function load() {
  try {
    loading.value = true;
    error.value = null;
    const data = await getCustomerDetails(eventId, customerId);
    details.value = data;
  } catch (e) {
    console.error("Failed to load customer details:", e);
    error.value = e?.message || "Failed to load";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="max-w-4xl mx-auto space-y-6 p-4">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Customer Details</h1>
      <button
        @click="router.back()"
        class="text-sm text-blue-600 hover:underline"
      >
        ← Back
      </button>
    </header>

    <div v-if="loading" class="p-4 border border-dashed rounded-xl">
      Loading…
    </div>
    <div
      v-else-if="error"
      class="p-4 border border-red-300 bg-red-50 text-red-700 rounded-xl"
    >
      {{ error }}
    </div>

    <div v-else-if="!details?.customer">
      <p class="italic opacity-70">Customer not found.</p>
    </div>

    <div v-else class="space-y-6">
      <div class="flex flex-wrap gap-6 items-start">
        <img
          v-if="details.customer.profile_image_url"
          :src="details.customer.profile_image_url"
          alt=""
          class="w-40 h-40 object-cover rounded-xl border"
        />
        <div>
          <h2 class="text-2xl font-extrabold">{{ details.customer.name }}</h2>
          <p class="opacity-70 text-sm">
            {{ details.customer.gender || "Unknown gender" }} ·
            {{ details.customer.work_relationship || "Unknown occupation" }}
          </p>
          <p v-if="details.customer.phone" class="mt-1 text-sm opacity-80">
            📞 {{ details.customer.phone }}
          </p>
          <p v-if="details.customer.weight" class="text-sm opacity-80">
            ⚖️ {{ details.customer.weight }} kg
          </p>
        </div>
      </div>
      <!-- BAC Display -->
      <div class="mt-6">
        <h3 class="font-bold mb-3">🍺 Blood Alcohol Content (BAC)</h3>
        <BACDisplay
          :customer="customer"
          :event-id="eventId"
          :auto-refresh="true"
          :show-details="true"
        />
      </div>

      <!-- details -->
      <div class="grid grid-cols-2 gap-3 mt-4 text-md">
        <div><strong>Phone:</strong> {{ customer.phone || "—" }}</div>
        <div><strong>Shoe size:</strong> {{ customer.shoe_size || "—" }}</div>
        <div>
          <strong>Weight:</strong>
          {{ customer.weight ? customer.weight + " kg" : "—" }}
        </div>
        <div>
          <strong>Work:</strong> {{ customer.work_relationship || "—" }}
        </div>
        <div><strong>Gender:</strong> {{ customer.gender || "—" }}</div>
        <div><strong>Ethnicity:</strong> {{ customer.ethnicity || "—" }}</div>
        <div>
          <strong>Experience:</strong> {{ customer.experience_level || "—" }}
        </div>
      </div>

      <div class="grid sm:grid-cols-3 gap-4">
        <div class="rounded-xl border p-4 bg-bg4 text-center">
          <div class="text-sm opacity-70">Beers bought</div>
          <div class="text-2xl font-bold">
            {{ details.summary?.beers ?? 0 }}
          </div>
        </div>
        <div class="rounded-xl border p-4 bg-bg4 text-center">
          <div class="text-sm opacity-70">Total spent</div>
          <div class="text-2xl font-bold">
            {{ details.summary?.tab?.toFixed(1) ?? "0.0" }} NOK
          </div>
        </div>
        <div class="rounded-xl border p-4 bg-bg4 text-center">
          <div class="text-sm opacity-70">Experience</div>
          <div class="text-2xl font-bold">
            {{ details.customer.experience_level || "-" }}
          </div>
        </div>
      </div>

      <div class="rounded-xl border p-4 bg-bg2">
        <h3 class="text-lg font-bold mb-3">Transactions</h3>
        <ul class="divide-y">
          <li
            v-for="t in details.transactions"
            :key="t.id"
            class="py-2 flex justify-between text-sm"
          >
            <span>
              {{ t.beer_name ?? "Unknown beer" }}
              ({{ t.qty }}×)
            </span>
            <span class="tabular-nums">{{ t.unit_price.toFixed(1) }} NOK</span>
          </li>
          <li
            v-if="!details.transactions.length"
            class="italic opacity-60 py-2"
          >
            No transactions yet
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
