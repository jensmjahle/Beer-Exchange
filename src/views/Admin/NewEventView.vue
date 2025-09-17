<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createEventMultipart } from '@/services/events.service.js'

const router = useRouter()

// form state
const name = ref('')
const currency = ref('NOK')
const startLive = ref(true)
const imageFile = ref(null)
const imagePreview = ref(null)

const creating = ref(false)
const currencies = ref([])

function loadCurrencies() {
  try {
    // Modern browsers: dynamic list from the runtime
    if (typeof Intl.supportedValuesOf === 'function') {
      currencies.value = Intl.supportedValuesOf('currency')
        .filter(c => typeof c === 'string')
        .sort()
    } else {
      // Fallback minimal set (edit as you like)
      currencies.value = ['NOK', 'SEK', 'DKK', 'EUR', 'USD', 'GBP']
    }
  } catch {
    currencies.value = ['NOK', 'SEK', 'DKK', 'EUR', 'USD', 'GBP']
  }
}

function onFileChange(e) {
  const f = e.target.files?.[0]
  imageFile.value = f || null
  if (f) {
    const reader = new FileReader()
    reader.onload = () => (imagePreview.value = reader.result)
    reader.readAsDataURL(f)
  } else {
    imagePreview.value = null
  }
}

async function submit() {
  if (!name.value.trim()) {
    alert('Please enter a name')
    return
  }
  creating.value = true
  try {
    const formData = new FormData()
    formData.append('name', name.value.trim())
    formData.append('currency', currency.value)
    formData.append('startLive', String(startLive.value))
    if (imageFile.value) formData.append('image', imageFile.value)

    const ev = await createEventMultipart(formData)
    router.push({ name: 'event', params: { eventId: ev.id } })
  } catch (e) {
    alert(e?.message || 'Failed to create event')
  } finally {
    creating.value = false
  }
}

onMounted(loadCurrencies)
</script>

<template>
  <section class="max-w-3xl mx-auto space-y-6">
    <header>
      <h1 class="text-3xl font-extrabold">Create New Event</h1>
      <p class="opacity-70">Configure details and upload a cover image.</p>
    </header>

    <form @submit.prevent="submit" class="space-y-6 rounded-2xl border p-5 border-[var(--color-border3)] bg-[var(--color-button4)]">
      <!-- Name -->
      <div>
        <label class="block text-sm mb-1">Name</label>
        <input
          v-model="name"
          type="text"
          placeholder="Beer Night"
          class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]"
          required
        />
      </div>

      <!-- Currency + Live -->
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Currency</label>
          <select
            v-model="currency"
            class="w-full rounded-lg border px-3 py-2 border-[var(--color-border3)] bg-[var(--color-bg4)]"
          >
            <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="flex items-end">
          <label class="inline-flex items-center gap-2">
            <input type="checkbox" v-model="startLive" class="h-4 w-4" />
            <span class="text-sm">Start live now</span>
          </label>
        </div>
      </div>

      <!-- Image upload -->
      <div>
        <label class="block text-sm mb-1">Cover Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          @change="onFileChange"
          class="block w-full text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:bg-[var(--color-bg4)] file:border-[var(--color-border3)]"
        />
        <div v-if="imagePreview" class="mt-3">
          <img :src="imagePreview" alt="preview" class="max-h-56 rounded-lg border border-[var(--color-border3)]" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3">
        <router-link
        :to="{ name: 'admin-events' }"
        class="rounded-lg border px-3 py-2 border-[var(--color-border3)] hover:bg-[var(--color-bg4)]"
  >
  Cancel
</router-link>

        <button
          type="submit"
          :disabled="creating"
          class="rounded-lg px-4 py-2 font-semibold
                 border border-[var(--color-button1-border)]
                 bg-[var(--color-button1)]
                 text-[var(--color-button1-meta)]
                 hover:bg-[var(--color-button1-hover)]
                 disabled:opacity-60"
        >
          {{ creating ? 'Creating…' : 'Create Event' }}
        </button>
      </div>
    </form>
  </section>
</template>
