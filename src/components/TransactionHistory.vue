<script setup>
defineProps({
  transactions: { type: Array, default: () => [] }
  // expected shape: [{ id, ts, beer_name, qty, unit_price, customer_name }]
})
function fmtTs(ts) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return '' }
}
function money(n) {
  if (n == null || Number.isNaN(n)) return ''
  return Number(n).toFixed(1)
}
</script>

<template>
  <div class="rounded-2xl border p-4 bg-bg2">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-lg">Recent Trades</h2>
      <span class="text-xs opacity-70">{{ transactions.length }}</span>
    </div>

    <ul class="divide-y">
      <li v-for="t in transactions" :key="t.id" class="py-2 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="font-medium truncate">
            {{ t.customer_name ?? 'Anonymous' }} bought {{ t.qty }} × {{ t.beer_name ?? t.beer_id }}
          </div>
          <div class="text-xs opacity-70">{{ fmtTs(t.ts) }}</div>
        </div>
        <div class="text-right">
          <div class="font-bold tabular-nums">{{ money(t.unit_price) }}</div>
          <div class="text-xs opacity-70">total {{ money((t.unit_price || 0) * (t.qty || 0)) }}</div>
        </div>
      </li>

      <li v-if="!transactions.length" class="py-3 text-sm opacity-60 italic">
        No trades yet
      </li>
    </ul>
  </div>
</template>
