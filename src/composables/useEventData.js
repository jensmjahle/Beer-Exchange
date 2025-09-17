import { ref, computed, onMounted, onUnmounted } from 'vue'
import { listEventBeers } from '@/services/beers.service'
import { listEventTransactions } from '@/services/transactions.service'

export function useEventData(eventId) {
  const loading = ref(true)
  const error = ref(null)
  const beers = ref([])
  const transactions = ref([])

  const prevPrices = new Map()
  const deltas = ref(new Map())

  let socket = null

  async function loadInitial() {
    loading.value = true
    error.value = null
    try {
      const [beersData, txData] = await Promise.all([
        listEventBeers(eventId),
        listEventTransactions(eventId, { limit: 100 })
      ])
      beers.value = beersData
      transactions.value = txData

      prevPrices.clear()
      deltas.value = new Map()
      beersData.forEach(b => {
        prevPrices.set(b.id, b.current_price)
        deltas.value.set(b.id, 0)
      })
    } catch (e) {
      error.value = e?.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  function connectSocket() {
    const io = window.io
    if (!io) return
    socket = io('/', { path: '/socket.io' })

    socket.on('prices', payload => {
      if (!payload || payload.eventId !== eventId) return
      const priceMap = new Map(payload.prices.map(p => [p.id, p.price]))
      beers.value = beers.value.map(b => {
        const newPrice = priceMap.get(b.id) ?? b.current_price
        const prev = prevPrices.get(b.id) ?? newPrice
        const d = newPrice - prev
        deltas.value.set(b.id, (deltas.value.get(b.id) ?? 0) + d)
        prevPrices.set(b.id, newPrice)
        return { ...b, current_price: newPrice }
      })
    })

    socket.on('tx', payload => {
      if (!payload || payload.eventId !== eventId) return
      transactions.value = [payload.tx, ...transactions.value].slice(0, 200)
    })
  }

  function disconnectSocket() {
    if (socket && socket.disconnect) socket.disconnect()
    socket = null
  }

  const topWinners = computed(() =>
    beers.value.map(b => ({ ...b, delta: deltas.value.get(b.id) ?? 0 }))
      .filter(x => x.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3)
  )
  const topLosers = computed(() =>
    beers.value.map(b => ({ ...b, delta: deltas.value.get(b.id) ?? 0 }))
      .filter(x => x.delta < 0)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 3)
  )

  onMounted(async () => {
    await loadInitial()
    connectSocket()
  })
  onUnmounted(disconnectSocket)

  return { loading, error, beers, transactions, topWinners, topLosers, refresh: loadInitial }
}
