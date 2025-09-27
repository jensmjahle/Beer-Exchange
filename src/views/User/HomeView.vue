
<template>
  <section class="mx-auto max-w-6xl px-4 py-8 space-y-6">
    <header class="text-center space-y-2">
      <h1 class="text-3xl font-extrabold">Live Beer Exchanges</h1>
      <p class="opacity-70">Jump into any live event below.</p>
    </header>

    <div v-if="loading" class="rounded-xl border border-dashed p-6 text-center">
      Loading…
    </div>
    <div v-else-if="error" class="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700 text-center">
      {{ error }}
    </div>

    <div v-else>
      <div v-if="!liveEvents.length" class="rounded-xl border p-8 text-center opacity-70">
        No live events right now.
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="e in liveEvents"
          :key="e.id"
          class="rounded-xl border border-[var(--color-border3)] bg-[var(--color-button4)] overflow-hidden flex flex-col"
        >
          <img
            v-if="e.image_url"
            :src="e.image_url"
            alt=""
            class="h-36 w-full object-cover border-b border-[var(--color-border3)]"
          />
          <div class="p-4 flex-1 flex flex-col gap-2">
            <h3 class="font-bold text-lg line-clamp-1">{{ e.name || 'Untitled Event' }}</h3>
            <div class="text-sm opacity-70">
              <span class="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">live</span>
              <span v-if="e.starts_at" class="ml-2">{{ fmt(e.starts_at) }}</span>
            </div>

            <router-link
              :to="{ name: 'event', params: { eventId: e.id } }"
              class="mt-auto inline-flex items-center justify-center rounded-lg border
                     border-[var(--color-border3)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg4)]"
            >
              Enter
            </router-link>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listEvents } from '@/services/events.service.js'

const loading = ref(true)
const error = ref(null)
const events = ref([])

function fmt(d) {
  try { return new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return '' }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    events.value = await listEvents()
  } catch (e) {
    error.value = e?.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
}

const liveEvents = computed(() => events.value.filter(e => e.status === 'live'))

onMounted(load)
</script>
