<script setup>
defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
  side: { type: String, default: 'left' }
})
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-border3)] bg-[var(--color-button4)] p-4">
    <h2 class="font-bold mb-3">{{ title }}</h2>
    <ul class="space-y-2">
      <li v-for="it in items" :key="it.id"
          class="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-[var(--color-border4)] bg-[var(--color-bg4)] px-3 py-2">
        <span class="font-semibold truncate">{{ it.name ?? it.id }}</span>
        <span class="opacity-80 tabular-nums">{{ it.current_price.toFixed(1) }} kr</span>
        <span class="tabular-nums font-semibold"
              :class="it.delta > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'">
          <template v-if="it.delta > 0">▲</template>
          <template v-else>▼</template>
          {{ Math.abs(it.delta).toFixed(1) }}
        </span>
      </li>
      <li v-if="!items.length" class="text-sm italic opacity-60">No changes yet</li>
    </ul>
  </div>
</template>
