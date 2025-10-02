<script setup>
import { ref, onMounted } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { getCustomerDetails } from '@/services/customers.service.js'
import BaseButton from "@/components/base/BaseButton.vue";
import BACDisplay from "@/components/BACDisplay.vue";

const props = defineProps({
  eventId: { type: String, required: true },
  customerId: { type: String, required: true },
  currency: { type: String, default: 'NOK' }
})

const route = useRoute()
const router = useRouter()
const eventId = String(route.params.eventId || '')
const loading = ref(true)
const error = ref(null)
const customer = ref(null)
const summary = ref(null)
const transactions = ref([])

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await getCustomerDetails(props.customerId, props.eventId)
    customer.value = data.customer
    summary.value = data.summary
    transactions.value = data.transactions
  } catch (e) {
    error.value = e?.message || 'Failed to load customer details'
  } finally {
    loading.value = false
  }
}
function backToEvent() {
  router.push({ name: 'event', params: { eventId } })
}
onMounted(load)
</script>

<template>
  <div>
  <BaseButton @click="backToEvent" class="mb-4" variant="button2">← Back to event</BaseButton>
  <div class="rounded-2xl border p-4 bg-bg2">
    <div v-if="loading" class="p-4 text-sm">Loading…</div>
    <div v-else-if="error" class="p-4 text-danger">{{ error }}</div>

    <div v-else-if="customer">
      <!-- profile -->
      <div class="flex justify-center mb-4">
        <img v-if="customer.profile_image_url"
             :src="customer.profile_image_url"
             alt="Profile"
             class="w-32 h-32 rounded-full object-cover border" />
        <div v-else
             class="w-32 h-32 rounded-full bg-gray-400 flex items-center justify-center text-xl font-bold text-white">
          {{ customer.name.charAt(0).toUpperCase() }}
        </div>
      </div>

      <h2 class="text-3xl font-bold text-center mb-2">{{ customer.name }}</h2>
      <p class="text-center text-lg opacity-70">{{ customer.sexual_orientation || '—' }}</p>

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
        <div><strong>Phone:</strong> {{ customer.phone || '—' }}</div>
        <div><strong>Shoe size:</strong> {{ customer.shoe_size || '—' }}</div>
        <div><strong>Weight:</strong> {{ customer.weight ? customer.weight + ' kg' : '—' }}</div>
        <div><strong>Work:</strong> {{ customer.work_relationship || '—' }}</div>
        <div><strong>Gender:</strong> {{ customer.gender || '—' }}</div>
        <div><strong>Ethnicity:</strong> {{ customer.ethnicity || '—' }}</div>
        <div><strong>Experience:</strong> {{ customer.experience_level || '—' }}</div>
      </div>

      <!-- stats -->
      <div v-if="summary" class="mt-6">
        <h3 class="font-bold mb-2">Stats</h3>
        <p>Total beers: {{ summary.beers }}</p>
        <p>Total spent: {{ summary.tab.toFixed(2) }} {{ currency }}</p>
      </div>

      <!-- transactions -->
      <div v-if="transactions?.length" class="mt-6">
        <h3 class="font-bold mb-2">Transactions</h3>
        <ul class="space-y-1 text-sm">
          <li v-for="t in transactions" :key="t.id" class="flex justify-between border-b pb-1">
            <span>{{ t.qty }} × {{ t.beer_name }}</span>
            <span>{{ t.total.toFixed(2) }} {{ currency }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
      </div>
</template>
