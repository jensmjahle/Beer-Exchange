<script setup>
defineProps({
  title: { type: String, required: true },
  items: { type: Array, default: () => [] }, // [{ id, name, current_price, delta }]
  side: { type: String, default: 'left' }    // just for potential styling
})
function fmt(n) {
  if (n == null || Number.isNaN(n)) return ''
  return Number(n).toFixed(1)
}
</script>

<template>
  <div class="rounded-2xl border p-4 bg-[var(--color-button4)]">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-lg">{{ title }}</h2>
      <span class="text-xs opacity-70">{{ items.length }} items</span>
    </div>

    <ul class="space-y-2">
      <li v-for="b in items" :key="b.id"
          class="rounded-xl border bg-bg4 px-3 py-2 flex items-center gap-3">
        <div class="w-2 h-2 rounded-full"
             :class="b.delta > 0 ? 'bg-green-500' : 'bg-red-500'"></div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ b.name ?? b.beer_id }}</div>
          <div class="text-xs opacity-70">
            Now {{ fmt(b.current_price) }}
          </div>
        </div>

        <div class="text-right">
          <div
            class="text-sm font-bold tabular-nums"
            :class="b.delta > 0 ? 'text-green-600' : 'text-red-600'">
            {{ b.delta > 0 ? '▲' : '▼' }} {{ fmt(Math.abs(b.delta)) }}
          </div>
        </div>
      </li>

      <li v-if="!items.length" class="text-sm opacity-60 italic px-1">No movement yet</li>
    </ul>
  </div>
</template>
