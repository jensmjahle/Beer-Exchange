<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { listEventCustomers } from '@/services/customers.service.js'
import NewCustomerModal from '@/components/modals/NewCustomerModal.vue'

// base components
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDropdown from '@/components/base/BaseDropdown.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  eventId: { type: String, required: true },
  beer: { type: Object, required: true },
  currency: { type: String, default: 'NOK' },
})

const emit = defineEmits(['close', 'confirm'])

const customers = ref([])
const error = ref(null)

const selectedCustomerId = ref('')
const qty = ref(1)

const showAddCustomer = ref(false)

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

function onCustomerCreated(c) {
  customers.value.unshift(c)
  selectedCustomerId.value = c.id
}

function onConfirm() {
  if (!selectedCustomerId.value) return alert('Select a customer')
  emit('confirm', {
    event_beer_id: props.beer.id,
    customer_id: selectedCustomerId.value,
    qty: Math.max(1, Number(qty.value || 1)),
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
      <!-- Header -->
      <header class="mb-4">
        <h3 class="text-xl font-extrabold">Buy {{ beer?.name ?? beer?.beer_id }}</h3>
        <p class="text-sm opacity-70">
          Unit price:
          <strong>{{ unitPrice.toFixed(1) }} {{ currency }}</strong>
        </p>
      </header>

      <!-- Error -->
      <div v-if="error" class="mb-3 rounded-lg border border-[var(--color-danger-border)] bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
        {{ error }}
      </div>

      <div class="space-y-4">
        <!-- Customer -->
        <div>
          <label class="mb-1 block text-sm font-medium">Customer</label>
          <p class="mb-2 text-xs text-[var(--color-text2-faded)]">
            Choose who is buying. Not on the list? Create a new customer.
          </p>
          <div class="flex gap-2">
            <BaseDropdown v-model="selectedCustomerId" class="flex-1">
              <option value="">— Select customer —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">
                {{ c.name }} <span v-if="c.phone">({{ c.phone }})</span>
              </option>
            </BaseDropdown>
            <BaseButton variant="button4" type="button" @click="showAddCustomer = true">
              New
            </BaseButton>
          </div>
        </div>

        <!-- Quantity -->
        <div>
          <label class="mb-1 block text-sm font-medium">Quantity</label>
          <p class="mb-2 text-xs text-[var(--color-text2-faded)]">
            Number of units to purchase.
          </p>
          <div class="grid grid-cols-[1fr_auto] items-end gap-3">
            <BaseInput
              v-model.number="qty"
              type="number"
              min="1"
              :label="null"
              :help="null"
            />
            <div class="text-right">
              <div class="mb-1 text-sm opacity-70">Total</div>
              <div class="text-xl font-extrabold tabular-nums">
                {{ total.toFixed(1) }} {{ currency }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-5 flex justify-end gap-2">
        <BaseButton variant="button4" @click="$emit('close')">Cancel</BaseButton>
        <BaseButton variant="button1" @click="onConfirm">Buy</BaseButton>
      </div>
    </div>

    <!-- New Customer Modal -->
    <NewCustomerModal
      :open="showAddCustomer"
      :event-id="eventId"
      @close="showAddCustomer = false"
      @created="onCustomerCreated"
    />
  </div>
</template>

