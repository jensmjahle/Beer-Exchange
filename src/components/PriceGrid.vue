<script setup>
defineProps({
  beers: { type: Array, default: () => [] } // [{ id, name, current_price, base_price, min_price, max_price }]
})
function fmt(n) {
  if (n == null || Number.isNaN(n)) return ''
  return Number(n).toFixed(1)
}
function pctOfRange(b) {
  // position of current price within [min,max] (0..100)
  const min = Number(b.min_price ?? 0)
  const max = Number(b.max_price ?? 0)
  const cur = Number(b.current_price ?? 0)
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0
  return Math.max(0, Math.min(100, ((cur - min) / (max - min)) * 100))
}
</script>

<template>
  <div class="rounded-2xl border p-4 bg-[var(--color-button4)]">
    <h2 class="font-bold text-lg mb-3">Live Prices</h2>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="b in beers" :key="b.id"
               class="rounded-xl border bg-[var(--color-bg4)] p-3 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-semibold truncate">{{ b.name ?? b.beer_id }}</h3>
            <div class="text-xs opacity-70">
              base {{ fmt(b.base_price) }} · min {{ fmt(b.min_price) }} · max {{ fmt(b.max_price) }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-xl font-extrabold tabular-nums">{{ fmt(b.current_price) }}</div>
          </div>
        </div>

        <!-- range bar -->
        <div class="mt-1">
          <div class="h-2 rounded bg-gray-200 overflow-hidden">
            <div class="h-full"
                 :style="{ width: pctOfRange(b) + '%' }"
                 :class="[
                   pctOfRange(b) < 33 ? 'bg-red-400' :
                   pctOfRange(b) < 66 ? 'bg-amber-400' : 'bg-green-500'
                 ]"></div>
          </div>
          <div class="flex justify-between text-[10px] opacity-70 mt-1">
            <span>{{ fmt(b.min_price) }}</span>
            <span>{{ fmt(b.max_price) }}</span>
          </div>
        </div>
      </article>

      <div v-if="!beers.length" class="col-span-full text-sm opacity-60 italic">
        No beers loaded for this event.
      </div>
    </div>
  </div>
</template>
