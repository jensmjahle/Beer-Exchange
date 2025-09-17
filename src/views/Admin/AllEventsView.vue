<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listEvents, createEvent } from '@/services/events.service.js'
import EventCard from '@/components/EventCard.vue'

const router = useRouter()
const loading = ref(true)
const error = ref(null)
const events = ref([])

async function load() {
  loading.value = true
  error.value = null
  try {
    events.value = await listEvents()
  } catch (e) {
    error.value = e?.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function onCreate() {
  try {
    const ev = await createEvent({ name: 'New Beer Exchange', currency: 'NOK' })
    router.push({ name: 'event', params: { eventId: ev.id } })
  } catch (e) {
    alert(e?.message || 'Failed to create event')
  }
}

function goToAdminEvents() {
  router.push({ name: 'admin-events' })
}

const liveEvents = computed(() => events.value.filter(e => e.status === 'live'))
const draftEvents = computed(() => events.value.filter(e => e.status === 'draft'))
const closedEvents = computed(() => events.value.filter(e => e.status === 'closed'))

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-extrabold">Events</h1>
        <button
          @click="goToAdminEvents"
          class="text-sm rounded-lg border px-3 py-1.5 border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
          title="Back to events list"
        >
          ← All events
        </button>
      </div>

      <button
        @click="$router.push({ name: 'event-new' })"
        class="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold
               border border-[var(--color-button1-border)]
               bg-[var(--color-button1)]
               text-[var(--color-button1-meta)]
               hover:bg-[var(--color-button1-hover)]">
        + Create New Event
      </button>
    </header>

    <div v-if="loading" class="rounded-xl border border-dashed p-6">Loading…</div>
    <div v-else-if="error" class="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">
      Error: {{ error }}
    </div>

    <div v-else class="space-y-8">
      <section v-if="liveEvents.length">
        <h2 class="mb-3 text-xl font-bold">Live</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EventCard v-for="e in liveEvents" :key="e.id" :item="e" />
        </div>
      </section>

      <section v-if="draftEvents.length">
        <h2 class="mb-3 text-xl font-bold">Drafts</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EventCard v-for="e in draftEvents" :key="e.id" :item="e" />
        </div>
      </section>

      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-xl font-bold">History</h2>
          <button
            class="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm
                   border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
            @click="load"
          >
            Refresh
          </button>
        </div>

        <div v-if="!closedEvents.length" class="rounded-xl border p-4 opacity-70">
          No closed events yet.
        </div>
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EventCard v-for="e in closedEvents" :key="e.id" :item="e" />
        </div>
      </section>
    </div>
  </section>
</template>
