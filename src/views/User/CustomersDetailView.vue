<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getEvent } from '@/services/events.service.js'
import { getCustomerDetails } from '@/services/customers.service.js'

const route = useRoute()
const router = useRouter()
const eventId = String(route.params.eventId || '')
const customerId = String(route.params.customerId || '')

const loading = ref(true)
const error = ref(null)
const ev = ref(null)
const detail = ref({ customer: null, summary: { beers: 0, tab: 0 }, transactions: [] })

function money(n) {
  if (n == null || Number.isNaN(n)) return '0.0'
  return Number(n).toFixed(1)
}
function fmtTs(ts) {
  try { return new Date(ts).toLocaleString() } catch { return ts }
}

async function load() {
  loading.value = true; error.value = null
  try {
    const [e, d] = await Promise.all([
      getEvent(eventId),
      getCustomerDetails(customerId, eventId)
    ])
    ev.value = e
    detail.value = d
  } catch (e) {
    error.value = e?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-extrabold">Customer</h1>
        <p class="opacity-70 text-sm">
          Event: {{ eventId }} · {{ detail.customer?.name || customerId }}
        </p>
      </div>
      <button class="rounded-lg border px-3 py-1.5 border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
              @click="router.push({ name: 'event', params: { eventId } })">← Back to Event</button>
    </header>

    <div v-if="loading" class="rounded-xl border border-dashed p-6">Loading…</div>
    <div v-else-if="error" class="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">{{ error }}</div>

    <div v-else class="space-y-6">
      <div class="grid sm:grid-cols-3 gap-4">
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-xs opacity-70">Name</div>
          <div class="text-lg font-bold">{{ detail.customer?.name }}</div>
        </div>
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-xs opacity-70">Beers</div>
          <div class="text-2xl font-extrabold tabular-nums">{{ detail.summary?.beers ?? 0 }}</div>
        </div>
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-xs opacity-70">Tab</div>
          <div class="text-2xl font-extrabold tabular-nums">
            {{ money(detail.summary?.tab ?? 0) }} {{ ev?.currency ?? 'NOK' }}
          </div>
        </div>
      </div>

      <div class="rounded-2xl border p-4 bg-[var(--color-button4)]">
        <h2 class="font-bold text-lg mb-3">Transactions</h2>
        <ul class="divide-y">
          <li v-for="t in detail.transactions" :key="t.id" class="py-2 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="font-medium truncate">
                Bought {{ t.qty }} × {{ t.beer_name ?? t.beer_id ?? 'Beer' }}
              </div>
              <div class="text-xs opacity-70">{{ fmtTs(t.ts) }}</div>
            </div>
            <div class="text-right">
              <div class="font-bold tabular-nums">{{ money(t.unit_price) }}</div>
              <div class="text-xs opacity-70">total {{ money((t.unit_price || 0) * (t.qty || 0)) }}</div>
            </div>
          </li>
          <li v-if="!detail.transactions?.length" class="py-3 text-sm opacity-60 italic">No transactions</li>
        </ul>
      </div>
    </div>
  </section>
</template>
