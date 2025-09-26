<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { listEventCustomers, createCustomer } from '@/services/customers.service.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  eventId: { type: String, required: true },
  beer: { type: Object, required: true }, // { id, current_price, ... }
  currency: { type: String, default: 'NOK' },
})

const emit = defineEmits(['close', 'confirm'])

const customers = ref([])
const error = ref(null)

// purchase state
const selectedCustomerId = ref('')
const qty = ref(1)

// quick add customer
const showAddCustomer = ref(false)
const newName = ref('')
const newPhone = ref('')

const unitPrice = computed(() => Number(props.beer?.current_price || 0))
const total = computed(() => (Math.max(1, Number(qty.value || 1)) * unitPrice.value))

async function loadCustomers() {
  error.value = null
  try {
    customers.value = await listEventCustomers(props.eventId)
  } catch (e) {
    error.value = e?.message || 'Failed to load customers'
  }
}

async function addCustomer() {
  if (!newName.value.trim()) return
  try {
    const c = await createCustomer(props.eventId, { name: newName.value.trim(), phone: newPhone.value.trim() || null })
    customers.value.unshift(c)
    selectedCustomerId.value = c.id
    newName.value = ''
    newPhone.value = ''
    showAddCustomer.value = false
  } catch (e) {
    alert(e?.message || 'Failed to add customer')
  }
}

function onConfirm() {
  if (!selectedCustomerId.value) return alert('Select a customer')
  emit('confirm', {
    event_beer_id: props.beer.id,
    customer_id: selectedCustomerId.value,
    qty: Math.max(1, Number(qty.value || 1)),
    // NOTE: no unit_price from client
  })
}

watch(() => props.open, (v) => {
  if (v && props.beer) {
    qty.value = 1
    selectedCustomerId.value = ''
    loadCustomers()
  }
})

onMounted(() => { if (props.open) loadCustomers() })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="relative z-10 w-[min(560px,92vw)] rounded-2xl border bg-[var(--color-button4)] p-5">
      <h3 class="text-lg font-bold mb-1">Buy {{ beer?.name ?? beer?.beer_id }}</h3>
      <p class="text-sm opacity-70 mb-4">
        Unit price: <strong>{{ unitPrice.toFixed(1) }} {{ currency }}</strong>
      </p>

      <div v-if="error" class="mb-3 text-sm text-red-600">Customers: {{ error }}</div>

      <div class="space-y-4">
        <!-- customer -->
        <div>
          <label class="block text-sm mb-1">Customer</label>
          <div class="flex gap-2">
            <select v-model="selectedCustomerId"
                    class="flex-1 rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]">
              <option value="">— Select customer —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.name }} <span v-if="c.phone">({{ c.phone }})</span>
              </option>
            </select>
            <button type="button"
                    class="rounded-lg border px-3 py-2 border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
                    @click="showAddCustomer = !showAddCustomer">
              New
            </button>
          </div>
        </div>

        <div v-if="showAddCustomer" class="rounded-xl border p-3 bg-[var(--color-bg4)] space-y-2">
          <div class="grid sm:grid-cols-3 gap-2">
            <input v-model="newName" type="text" placeholder="Name"
                   class="sm:col-span-2 rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
            <input v-model="newPhone" type="text" placeholder="Phone (optional)"
                   class="rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
          </div>
          <div class="text-right">
            <button class="rounded-lg px-3 py-1.5 bg-[var(--color-button1)] hover:bg-[var(--color-button1-hover)]"
                    @click="addCustomer">Add</button>
          </div>
        </div>

        <!-- qty and total -->
        <div class="grid grid-cols-[1fr_auto] items-end gap-3">
          <div>
            <label class="block text-sm mb-1">Qty</label>
            <input v-model.number="qty" type="number" min="1"
                   class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
          </div>
          <div class="text-right">
            <div class="text-sm opacity-70 mb-1">Total</div>
            <div class="text-xl font-extrabold tabular-nums">
              {{ total.toFixed(1) }} {{ currency }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <button class="rounded-lg border px-3 py-1.5 border-[var(--color-border3)]" @click="$emit('close')">Cancel</button>
        <button class="rounded-lg px-3 py-1.5 bg-[var(--color-button1)] hover:bg-[var(--color-button1-hover)]" @click="onConfirm">Buy</button>
      </div>
    </div>
  </div>
</template>
