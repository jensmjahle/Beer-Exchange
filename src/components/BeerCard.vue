<script setup>
const props = defineProps({
  beer: { type: Object, required: true },
  currency: { type: String, default: 'NOK' }
})
const emit = defineEmits(['buy','open'])

function fmt(n) {
  if (n == null || Number.isNaN(n)) return ''
  return Number(n).toFixed(1)
}
function pctOfRange(b) {
  const min = Number(b.min_price ?? 0)
  const max = Number(b.max_price ?? 0)
  const cur = Number(b.current_price ?? 0)
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0
  return Math.max(0, Math.min(100, ((cur - min) / (max - min)) * 100))
}
</script>

<template>
  <article
    class="rounded-xl border bg-bg3 p-3 flex flex-col text-tex3 gap-2 cursor-pointer hover:shadow-sm transition"
    @click="$emit('open', beer)"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-semibold truncate">{{ beer.name ?? beer.beer_id }}</h3>
        <div class="text-xs opacity-70">
          base {{ fmt(beer.abv) }} · min {{ fmt(beer.min_price) }} · max {{ fmt(beer.max_price) }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-xl font-extrabold tabular-nums">
          {{ fmt(beer.current_price) }} {{ currency }}
        </div>
      </div>
    </div>

    <div class="mt-1">
      <div class="h-2 rounded bg-bg3 overflow-hidden">
        <div class="h-full"
             :style="{ width: pctOfRange(beer) + '%' }"
             :class="[
               pctOfRange(beer) < 33 ? 'bg-red-400' :
               pctOfRange(beer) < 66 ? 'bg-amber-400' : 'bg-green-500'
             ]"></div>
      </div>
      <div class="flex justify-between text-[10px] opacity-70 mt-1">
        <span>{{ fmt(beer.min_price) }}</span>
        <span>{{ fmt(beer.max_price) }}</span>
      </div>
    </div>

    <div class="mt-2">
      <button
        class="w-full rounded-lg px-3 py-2 font-semibold
               border border-[var(--color-button1-border)]
               bg-[var(--color-button1)]
               text-[var(--color-button1-meta)]
               hover:bg-[var(--color-button1-hover)]"
        @click.stop="$emit('buy', beer)"
      >
        Buy
      </button>
    </div>
  </article>
</template>
