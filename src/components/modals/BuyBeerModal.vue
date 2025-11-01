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
const customers = ref([])          // [{ id,name, ... }]
const volumes = ref([])            // [{ label, value }]
const selectedCustomer = ref('')   // string id
const selectedVolume = ref('')     // string (BaseDropdown sender string)

const loadingCustomers = ref(false)

async function loadCustomers() {
  try {
    loadingCustomers.value = true
    const rows = await listCustomers(props.eventId)
    customers.value = Array.isArray(rows) ? rows : []
    // IKKE autoselect:
    selectedCustomer.value = ''
  } catch (e) {
    console.error('Feil ved henting av kunder:', e)
    alert('Kunne ikke hente kundeliste')
  } finally {
    loadingCustomers.value = false
  }
}

function rebuildVolumes() {
  const list = Array.isArray(props.beer?.volumes) ? props.beer.volumes : []
  volumes.value = list.map(v => ({ label: `${v.volume_ml} ml`, value: String(v.volume_ml) }))
  // IKKE autoselect:
  selectedVolume.value = ''
}

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

const displayPrice = computed(() => {
  if (!props.beer || !selectedVolume.value) return '0.0'
  const liters = Number(selectedVolume.value) / 1000
  return (Number(props.beer.current_price) * liters * Number(qty.value)).toFixed(1)
})

async function buy() {
  if (!selectedCustomer.value) {
    alert('Velg en kunde først.')
    return
  }
  if (!selectedVolume.value) {
    alert('Velg et volum først.')
    return
  }
  try {
    const res = await createTransaction({
      event_id: props.eventId,
      event_beer_id: props.beer.id,
      customer_id: selectedCustomer.value,
      qty: Number(qty.value),
      volume_ml: Number(selectedVolume.value),
    })
    emit('bought', res)
    emit('close')
  } catch (e) {
    console.error('Feil ved kjøp:', e)
    alert('Kunne ikke fullføre kjøpet.')
  }
}
</script>

<template>
  <div class="modal" v-if="visible">
    <div class="modal-content">
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

      <p class="price mb-4">
        Pris: <strong>{{ displayPrice }} kr</strong>
      </p>

      <div class="actions flex justify-end gap-2">
        <BaseButton variant="button1" @click="buy">Kjøp</BaseButton>
        <BaseButton variant="secondary" @click="$emit('close')">Avbryt</BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal { @apply fixed inset-0 bg-black/50 flex items-center justify-center; }
.modal-content { @apply bg-white p-6 rounded-2xl shadow-xl w-80; }
.price { @apply font-semibold; }
</style>
