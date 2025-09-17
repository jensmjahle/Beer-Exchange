<script setup>
defineProps({
  beers: { type: Array, required: true }
})
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-border3)] bg-[var(--color-button4)] p-4">
    <h2 class="font-bold mb-4">Prices</h2>
    <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <div v-for="b in beers" :key="b.id"
           class="rounded-xl border border-[var(--color-border4)] bg-[var(--color-bg4)] p-3">
        <div class="font-semibold truncate">{{ b.name ?? b.id }}</div>
        <div class="text-2xl font-extrabold tabular-nums">{{ b.current_price.toFixed(1) }} kr</div>
        <div class="text-xs opacity-70">
          min {{ b.min_price }} • max {{ b.max_price }}
        </div>
      </div>
    </div>
  </div>
</template>
