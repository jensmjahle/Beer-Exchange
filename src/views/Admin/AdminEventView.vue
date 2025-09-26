<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getEvent } from '@/services/events.service.js'
import { listEventBeers, attachBeerToEvent } from '@/services/beers.service.js'
import { listEventCustomers, createCustomer } from '@/services/customers.service.js'

const route = useRoute()
const router = useRouter()
const eventId = String(route.params.eventId || '')

// state
const loading = ref(true)
const error = ref(null)
const ev = ref(null)
const beers = ref([])
const customers = ref([])

// quick-add modals
const showAddCustomer = ref(false)
const custName = ref('')
const custPhone = ref('')

const showAddBeer = ref(false)
const newBeer = ref({
  beer_id: '',       // existing catalog beer id
  base_price: 15,
  min_price: 10,
  max_price: 25,
  position: 0,
  active: 1,
})

// placeholder: if you have a catalog endpoint, fetch it; for now, manual id input or later dropdown
const catalog = ref([]) // [{id, name}]

const stats = computed(() => ({
  beers: beers.value.length,
  customers: customers.value.length,
  // extend: revenue, orders, etc.
}))

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [e, b, c] = await Promise.all([
      getEvent(eventId),
      listEventBeers(eventId),
      listEventCustomers(eventId),
    ])
    ev.value = e
    beers.value = b
    customers.value = c
  } catch (e) {
    error.value = e?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function addCustomer() {
  if (!custName.value.trim()) return
  try {
    const created = await createCustomer(eventId, {
      name: custName.value.trim(),
      phone: custPhone.value.trim() || null,
})
    customers.value.unshift(created)
    custName.value = ''
    custPhone.value = ''
    showAddCustomer.value = false
  } catch (e) {
    alert(e?.message || 'Failed to add customer')
  }
}

async function addBeer() {
  try {
    const payload = { ...newBeer.value }
    // basic sanity
    payload.base_price = Number(payload.base_price)
    payload.min_price = Number(payload.min_price)
    payload.max_price = Number(payload.max_price)
    if (!payload.beer_id) { alert('Select a beer'); return }
    if (payload.min_price > payload.max_price) { alert('Min > Max'); return }
    await attachBeerToEvent(eventId, payload)
    const refreshed = await listEventBeers(eventId)
    beers.value = refreshed
    showAddBeer.value = false
  } catch (e) {
    alert(e?.message || 'Failed to add beer')
  }
}

onMounted(loadAll)
</script>

<template>
  <section class="space-y-6">
    <!-- header -->
    <header class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold">Admin · Event</h1>
        <p class="opacity-70 text-sm">ID: {{ eventId }}</p>
      </div>
      <div class="flex gap-2">
        <router-link
          :to="{ name: 'admin-events' }"
          class="rounded-lg border px-3 py-1.5 text-sm border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
        >← All events</router-link>
        <router-link
          :to="{ name: 'event', params: { eventId } }"
          class="rounded-lg border px-3 py-1.5 text-sm border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
        >Open public view</router-link>
      </div>
    </header>

    <!-- loading / error -->
    <div v-if="loading" class="rounded-xl border border-dashed p-6">Loading…</div>
    <div v-else-if="error" class="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">Error: {{ error }}</div>

    <div v-else class="space-y-6">
      <!-- overview -->
      <div class="grid sm:grid-cols-3 gap-4">
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-sm opacity-70">Name</div>
          <div class="text-lg font-bold">{{ ev?.name }}</div>
        </div>
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-sm opacity-70">Status</div>
          <div class="font-semibold capitalize">{{ ev?.status }}</div>
        </div>
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-sm opacity-70">Currency</div>
          <div class="font-semibold">{{ ev?.currency }}</div>
        </div>
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-sm opacity-70">Beers</div>
          <div class="text-2xl font-extrabold tabular-nums">{{ stats.beers }}</div>
        </div>
        <div class="rounded-xl border p-4 bg-[var(--color-button4)]">
          <div class="text-sm opacity-70">Customers</div>
          <div class="text-2xl font-extrabold tabular-nums">{{ stats.customers }}</div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- customers -->
        <div class="rounded-2xl border p-4 bg-[var(--color-button4)]">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-lg">Customers</h2>
            <button
              class="rounded-lg border px-3 py-1.5 text-sm border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
              @click="showAddCustomer = true"
            >+ Add Customer</button>
          </div>
          <ul class="space-y-2">
            <li v-for="c in customers" :key="c.id"
                class="rounded-xl border px-3 py-2 bg-[var(--color-bg4)] flex items-center justify-between">
              <div>
                <div class="font-semibold">{{ c.name }}</div>
                <div class="text-xs opacity-70" v-if="c.phone">{{ c.phone }}</div>
              </div>
              <span class="text-xs opacity-70">#{{ c.id.slice?.(0,8) ?? c.id }}</span>
            </li>
            <li v-if="!customers.length" class="text-sm opacity-60 italic">No customers yet</li>
          </ul>
        </div>

        <!-- beers -->
        <div class="rounded-2xl border p-4 bg-[var(--color-button4)]">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-lg">Beers</h2>
            <button
              class="rounded-lg border px-3 py-1.5 text-sm border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
              @click="showAddBeer = true"
            >+ Add Beer to Event</button>
          </div>
          <ul class="space-y-2">
            <li v-for="b in beers" :key="b.id"
                class="rounded-xl border px-3 py-2 bg-[var(--color-bg4)] grid grid-cols-[1fr_auto] items-center gap-3">
              <div>
                <div class="font-semibold">{{ b.name ?? b.beer_id }}</div>
                <div class="text-xs opacity-70">
                  base {{ b.base_price }} • min {{ b.min_price }} • max {{ b.max_price }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-extrabold tabular-nums">{{ b.current_price?.toFixed?.(1) ?? b.current_price }} {{ ev?.currency }}</div>
                <div class="text-xs opacity-70">pos {{ b.position }}</div>
              </div>
            </li>
            <li v-if="!beers.length" class="text-sm opacity-60 italic">No beers attached</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- add customer modal -->
    <div v-if="showAddCustomer" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="showAddCustomer = false"></div>
      <div class="relative z-10 w-[min(520px,92vw)] rounded-2xl border bg-[var(--color-button4)] p-5">
        <h3 class="text-lg font-bold mb-3">Add Customer</h3>
        <div class="space-y-3">
          <input v-model="custName" type="text" placeholder="Name"
                 class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
          <input v-model="custPhone" type="text" placeholder="Phone (optional)"
                 class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="rounded-lg border px-3 py-1.5 border-[var(--color-border3)]" @click="showAddCustomer=false">Cancel</button>
          <button class="rounded-lg px-3 py-1.5 bg-[var(--color-button1)] hover:bg-[var(--color-button1-hover)]" @click="addCustomer">Add</button>
        </div>
      </div>
    </div>

    <!-- add beer modal -->
    <div v-if="showAddBeer" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="showAddBeer = false"></div>
      <div class="relative z-10 w-[min(560px,92vw)] rounded-2xl border bg-[var(--color-button4)] p-5">
        <h3 class="text-lg font-bold mb-3">Add Beer to Event</h3>
        <div class="space-y-3">
          <input v-model="newBeer.beer_id" type="text" placeholder="Catalog beer id"
                 class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
          <div class="grid grid-cols-3 gap-3">
            <div><label class="block text-xs opacity-70 mb-1">Base</label>
              <input v-model.number="newBeer.base_price" type="number" step="0.5" class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
            </div>
            <div><label class="block text-xs opacity-70 mb-1">Min</label>
              <input v-model.number="newBeer.min_price" type="number" step="0.5" class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
            </div>
            <div><label class="block text-xs opacity-70 mb-1">Max</label>
              <input v-model.number="newBeer.max_price" type="number" step="0.5" class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-xs opacity-70 mb-1">Position</label>
              <input v-model.number="newBeer.position" type="number" class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]" />
            </div>
            <div class="flex items-end">
              <label class="inline-flex items-center gap-2"><input type="checkbox" v-model="newBeer.active" class="h-4 w-4" /><span class="text-sm">Active</span></label>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="rounded-lg border px-3 py-1.5 border-[var(--color-border3)]" @click="showAddBeer=false">Cancel</button>
          <button class="rounded-lg px-3 py-1.5 bg-[var(--color-button1)] hover:bg-[var(--color-button1-hover)]" @click="addBeer">Add</button>
        </div>
      </div>
    </div>
  </section>
</template>
