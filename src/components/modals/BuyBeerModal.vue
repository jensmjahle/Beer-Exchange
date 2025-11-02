<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { createTransaction } from '@/services/transactions.service'
import { listCustomers } from '@/services/customers.service.js'
import BaseDropdown from '@/components/base/BaseDropdown.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  visible: Boolean,
  beer: Object,
  eventId: String,
})
const emit = defineEmits(['close', 'bought'])

const qty = ref(1)
const customers = ref([])
const volumes = ref([])
const selectedCustomer = ref('')
const selectedVolume = ref('')
const loadingCustomers = ref(false)
const submitting = ref(false)

const kurtasjeRates = [
  { label: 'Student', value: 0.8 },
  { label: 'Deltidsjobb', value: 0.16 },
  { label: 'Fulltidsjobb', value: 0.16 },
  { label: 'Arbeidsledig', value: 0.06 },
]

async function loadCustomers() {
  try {
    loadingCustomers.value = true
    const rows = await listCustomers(props.eventId)
    customers.value = Array.isArray(rows) ? rows : []
    selectedCustomer.value = ''
  } catch (e) {
    alert('Kunne ikke hente kundeliste')
    console.error(e)
  } finally {
    loadingCustomers.value = false
  }
}

function rebuildVolumes() {
  const list = Array.isArray(props.beer?.volumes) ? props.beer.volumes : []
  volumes.value = list.map(v => ({ label: `${v.volume_ml} ml`, value: String(v.volume_ml) }))
  selectedVolume.value = ''
}

const kurtasje = ref(0)
watch(selectedCustomer, (id) => {
  const customer = customers.value.find(c => c.id === id)
  if (!customer) {
    kurtasje.value = 0
    return
  }
  const match = kurtasjeRates.find(k =>
    customer.work_relationship?.toLowerCase() === k.label.toLowerCase()
  )
  kurtasje.value = match ? match.value : 0
})

watch(() => props.visible, (v) => {
  if (v) {
    rebuildVolumes()
    loadCustomers()
  }
})
onMounted(() => {
  if (props.visible) {
    rebuildVolumes()
    loadCustomers()
  }
})

const basePrice = computed(() => {
  if (!props.beer || !selectedVolume.value) return 0
  const liters = Number(selectedVolume.value) / 1000
  return Number(props.beer.current_price) * liters * Number(qty.value)
})
const kurtasjeAmount = computed(() => basePrice.value * Number(kurtasje.value || 0))
const totalPrice = computed(() => basePrice.value + kurtasjeAmount.value)

async function buy() {
  if (!selectedCustomer.value) return alert('Velg en kunde først.')
  if (!selectedVolume.value) return alert('Velg et volum først.')

  const payload = {
    event_id: props.eventId,
    event_beer_id: props.beer.id,
    customer_id: selectedCustomer.value,
    qty: Number(qty.value),
    volume_ml: Number(selectedVolume.value),
    price_client: Number(totalPrice.value.toFixed(2)),
  }

  console.log('[BUYBEER] Sending transaction payload →', payload)

  try {
    const res = await createTransaction(payload)
    console.log('[BUYBEER] Response ←', res)
    emit('bought', res)
    emit('close')
  } catch (e) {
    console.error('[BUYBEER] Failed to create transaction:', e)
    alert('Kunne ikke fullføre kjøpet.')
  }
}

</script>

<template>
  <div class="modal" v-if="visible">
    <div class="modal-content bg-bg2 text-text2">
      <h2 class="font-semibold text-lg mb-3">Kjøp {{ beer?.name }}</h2>

      <BaseDropdown
        v-if="volumes.length"
        v-model="selectedVolume"
        :options="volumes"
        label="Velg volum"
        description="Flaskestørrelse / serveringsvolum"
        placeholder="-- velg volum --"
        class="w-full mb-3"
      />

      <BaseDropdown
        v-model="selectedCustomer"
        :options="customers.map(c => ({ label: c.name, value: c.id }))"
        label="Velg kunde"
        :description="loadingCustomers ? 'Laster kunder…' : 'Hvem skal kjøpet registreres på?'"
        placeholder="-- velg kunde --"
        class="w-full mb-3"
      />

      <label for="qty" class="block text-sm font-medium text-text2 mb-1">Antall</label>
      <input
        id="qty"
        type="number"
        v-model.number="qty"
        min="1"
        class="w-full mb-3 border rounded px-2 py-1"
      />

      <div class="space-y-1 mb-4 text-sm">
        <p>Grunnpris: <strong>{{ basePrice.toFixed(2) }} kr</strong></p>
        <p>Kurtasje: <strong>{{ kurtasjeAmount.toFixed(2) }} kr</strong> ({{ (kurtasje * 100).toFixed(1) }}%)</p>
        <p class="border-t pt-1 mt-1 text-base font-semibold">
          Total: <strong>{{ totalPrice.toFixed(2) }} kr</strong>
        </p>
      </div>

      <div class="actions flex justify-end gap-2">
        <BaseButton :disabled="submitting" variant="button1" @click="buy">
          {{ submitting ? 'Kjøper…' : 'Kjøp' }}
        </BaseButton>
        <BaseButton :disabled="submitting" variant="secondary" @click="$emit('close')">
          Avbryt
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal { @apply fixed inset-0 bg-black/50 flex items-center justify-center; }
.modal-content { @apply p-6 rounded-2xl shadow-xl w-80; }
</style>
