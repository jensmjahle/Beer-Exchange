<template>
  <div class="modal" v-if="visible">
    <div class="modal-content">
      <h2>Kjøp {{ beer?.name }}</h2>

      <div v-if="beer?.volumes?.length">
        <label for="volume">Velg volum:</label>
        <select id="volume" v-model="selectedVolume">
          <option
            v-for="v in beer.volumes"
            :key="v.volume_ml"
            :value="v.volume_ml"
          >
            {{ v.volume_ml }} ml
          </option>
        </select>
      </div>

      <div>
        <label for="customer">Velg kunde:</label>
        <select id="customer" v-model="selectedCustomer" class="w-full mb-2 border rounded px-2 py-1">
          <option disabled value="">-- velg kunde --</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>


      <div v-if="beer?.volumes?.length">
        <label for="volume">Velg volum:</label>
        <select id="volume" v-model="selectedVolume">
          <option
            v-for="v in costumers"
            :key="v.volume_ml"
            :value="v.volume_ml"
          >
            {{ v.name}} ml
          </option>
        </select>
      </div>

      <label for="qty">Antall</label>
      <input id="qty" type="number" v-model.number="qty" min="1" />

      <p class="price">
        Pris:
        <strong>{{ displayPrice }} kr</strong>
      </p>

      <div class="actions">
        <button @click="buy">Kjøp</button>
        <button @click="$emit('close')">Avbryt</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue'
import { createTransaction } from '@/services/transactions.service'
import {listCustomers} from "@/services/customers.service.js";

const props = defineProps({
  visible: Boolean,
  beer: Object,
  eventId: String,
})
const emit = defineEmits(['close', 'bought'])

const qty = ref(1)
const selectedVolume = ref(props.beer?.volumes?.[0]?.volume_ml || 500)
const customers = ref([])
const loadingCustomers = ref(false)
const selectedCustomer = ref('')

async function loadCustomers() {
  try {
    loadingCustomers.value = true
    const rows = await listCustomers(props.eventId)
    customers.value = Array.isArray(rows) ? rows : []
    selectedCustomer.value = ''
  } catch (e) {
    console.error('Feil ved henting av kunder:', e)
    alert('Kunne ikke hente kundeliste')
  } finally {
    loadingCustomers.value = false
  }
}

watch(() => props.visible, (v) => { if (v) loadCustomers() })
onMounted(() => { if (props.visible) loadCustomers() })


const displayPrice = computed(() => {
  const liters = selectedVolume.value / 1000
  return (props.beer.current_price * liters * qty.value).toFixed(1)
})

async function buy() {
  if (!selectedCustomer.value) {
    alert('Velg en kunde først.')
    return
  }

  try {
    const res = await createTransaction({
      event_id: props.eventId,
      event_beer_id: props.beer.id,
      customer_id: selectedCustomer.value,
      qty: qty.value,
      volume_ml: selectedVolume.value,
    })
    emit('bought', res)
    emit('close')
  } catch (e) {
    console.error('Feil ved kjøp:', e)
    alert('Kunne ikke fullføre kjøpet.')
  }
}
</script>

<style scoped>
.modal { @apply fixed inset-0 bg-black/50 flex items-center justify-center; }
.modal-content { @apply bg-white p-6 rounded-2xl shadow-xl w-80; }
.actions { @apply mt-4 flex justify-end gap-2; }
.price { @apply mt-3 font-semibold; }
select, input { @apply border rounded px-2 py-1 w-full mb-2; }
</style>
