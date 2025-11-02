<script setup>
import {onMounted, onUnmounted, ref} from 'vue'
import { useRouter } from 'vue-router'
import BeerCard from './BeerCard.vue'
import BuyBeerModal from './modals/BuyBeerModal.vue'
import { createTransaction } from '@/services/transactions.service.js'
import LiveIndicator from "@/components/LiveIndicator.vue";
import { connectLive, on, off } from '@/services/live.service.js'
import {fetchBeersForEvent} from "@/services/beers.service.js";

const props = defineProps({
  eventId: { type: String, required: true },
  beers:   { type: Array,  default: () => [] },
  currency:{ type: String, default: 'NOK' },
})
const emit = defineEmits(['updated'])
const router = useRouter()

const buying = ref(false)
const selectedBeer = ref(null)
const liveSource = ref(null)

function openBuy(beer) {
  selectedBeer.value = beer
  buying.value = true
}
function closeBuy() {
  buying.value = false
  selectedBeer.value = null
}
function openStock(beer) {
  router.push({ name: 'beer-stock', params: { eventId: props.eventId, eventBeerId: beer.id } })
}



onMounted(() => {
  connectLive(props.eventId)

  const handlePrices = async () => {
    try {
      const updated = await fetchBeersForEvent(props.eventId)
      // Bruk props.beers (reactivt array)
      props.beers.splice(0, props.beers.length, ...updated)
    } catch (err) {
      console.error('[PriceGrid] refresh failed', err)
    }
  }

  on('priceUpdate', handlePrices)
  onUnmounted(() => off('priceUpdate', handlePrices))
})

</script>

<template>
  <div class="rounded-2xl border p-4 bg-bg2">
    <div class="flex flex-row  mb-3 gap-4">
        <h2 class="font-bold text-lg">Beer Prices</h2>
        <LiveIndicator />
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <BeerCard
        v-for="b in beers" :key="b.id"
        :beer="b" :currency="currency"
        @buy="openBuy"
        @open="openStock"
      />
      <div v-if="!beers.length" class="col-span-full text-sm opacity-60 italic">
        No beers loaded for this event.
      </div>
    </div>


    <BuyBeerModal
  v-if="selectedBeer"
  :visible="buying"
  :event-id="eventId"
  :beer="selectedBeer"
  :currency="currency"
  @close="closeBuy"/>

  </div>
</template>
