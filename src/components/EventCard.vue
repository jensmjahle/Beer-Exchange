<script setup>
defineProps({
  item: { type: Object, required: true } // { id, name, status, starts_at, ends_at }
})
function fmt(d) {
  if (!d) return ''
  return new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <div class="rounded-xl border border-[var(--color-border3)] bg-[var(--color-button4)] p-4 flex flex-col gap-2">
    <div class="flex items-center justify-between gap-3">
      <h3 class="font-bold text-lg truncate">{{ item.name || 'Untitled Event' }}</h3>
      <span
        class="px-2 py-0.5 text-xs rounded-full"
        :class="{
          'bg-green-100 text-green-700': item.status === 'live',
          'bg-amber-100 text-amber-700': item.status === 'draft',
          'bg-gray-200 text-gray-700': item.status === 'closed'
        }"
      >
        {{ item.status }}
      </span>
    </div>
<div v-if="item.image_url" class="mb-2">
  <img :src="item.image_url" alt="" class="w-full h-32 object-cover rounded-lg border border-[var(--color-border3)]" />
</div>

    <div class="text-sm opacity-80">
      <div v-if="item.starts_at">Start: {{ fmt(item.starts_at) }}</div>
      <div v-if="item.ends_at">End: {{ fmt(item.ends_at) }}</div>
    </div>

    <router-link
      :to="{ name: 'event', params: { eventId: item.id } }"
      class="mt-2 inline-flex items-center justify-center rounded-lg border border-[var(--color-border3)] px-3 py-1.5 text-sm
             hover:bg-[var(--color-bg4)]"
    >
      Open
    </router-link>
  </div>
</template>
