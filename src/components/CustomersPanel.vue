<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listCustomersWithStats, updateCustomer } from '@/services/customers.service'
import { listEventCustomersWithStats } from '@/services/customers.service.js'
import BACMini from '@/components/BACMini.vue'
import NewCustomerModal from "@/components/modals/NewCustomerModal.vue";
import BaseButton from "@/components/base/BaseButton.vue";

const props = defineProps({
  eventId: { type: String, required: true },
  currency: { type: String, default: 'NOK' }
})

const router = useRouter()
const loading = ref(true)
const error = ref(null)
const customers = ref([])
const showAddCustomer = ref(false)
const emit = defineEmits(['close', 'confirm'])
function money(n) {
  if (n == null || Number.isNaN(n)) return '0.0'
  return Number(n).toFixed(1)
}

async function load() {
  loading.value = true; error.value = null
  try { customers.value = await listCustomersWithStats(props.eventId) }
  catch (e) { error.value = e?.message || 'Failed to load' }
  finally { loading.value = false }
}

function openCustomer(c) {
  router.push({ name: 'customer-detail', params: { eventId: props.eventId, customerId: c.id } })
}
function onCustomerCreated(c) {
  customers.value.unshift(c)
}
onMounted(load)
</script>

<template>
  <div class="rounded-2xl border p-4 bg-bg2">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-lg">Kunder</h2>
      <div class="flex items-center gap-2">
       <BaseButton variant="button2" type="button" @click="load">
  Refresh
</BaseButton>
        <BaseButton variant="button4" type="button" @click="showAddCustomer = true">
              Ny Kunde
            </BaseButton>
     </div>
    </div>

    <div v-if="loading" class="rounded-xl border border-dashed p-4">Loading…</div>
    <div v-else-if="error" class="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">{{ error }}</div>

    <ul v-else class="divide-y">
      <li v-for="c in customers" :key="c.id"
          class="py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-bg4)] rounded px-2"
          @click="openCustomer(c)">
        <div class="flex items-center gap-3 min-w-0">
          <!-- profile image -->
          <img v-if="c.profile_image_url"
               :src="c.profile_image_url"
               alt="Profile"
               class="w-12 h-12 rounded-full object-cover border shrink-0" />
          <div v-else
               class="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {{ c.name.charAt(0).toUpperCase() }}
          </div>

          <!-- name + orientation + BAC -->
          <div class="min-w-0">
            <div class="font-semibold truncate">{{ c.name || 'Unknown customer' }}</div>
            <div class="text-xs opacity-70 truncate">{{ c.sexual_orientation || '—' }}</div>
            <div class="flex items-center gap-2 text-xs">
              <span class="opacity-70">{{ c.gender }}</span>
              <BACMini :customer="c" :event-id="eventId" size="mini" />
            </div>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="font-extrabold tabular-nums">{{ money(c.tab) }} {{ currency }}</div>
          <div class="text-xs opacity-70">{{ c.beers }} beers</div>
        </div>
      </li>

      <li v-if="!customers.length" class="py-3 text-sm opacity-60 italic">No customers yet</li>
    </ul>
  </div>
      <NewCustomerModal
      :open="showAddCustomer"
      :event-id="eventId"
      @close="showAddCustomer = false"
      @created="onCustomerCreated"
    />
</template>
