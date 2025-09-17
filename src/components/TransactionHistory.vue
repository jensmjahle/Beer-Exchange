<script setup>
defineProps({
  transactions: { type: Array, required: true }
})

function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-border3)] bg-[var(--color-button4)] p-4">
    <h2 class="font-bold mb-3">Transaction History</h2>
    <ul class="space-y-2">
      <li v-for="t in transactions" :key="t.id"
          class="grid grid-cols-[72px_110px_1fr_50px_110px_1fr] items-center gap-3 rounded-xl border border-[var(--color-border4)] bg-[var(--color-bg4)] px-3 py-2">
        <span class="opacity-80">{{ fmtTime(t.created_at) }}</span>
        <span class="font-semibold">{{ t.type }}</span>
        <span class="truncate">{{ t.event_beer_id ?? '-' }}</span>
        <span class="text-sm">x{{ t.qty }}</span>
        <span class="font-extrabold tabular-nums">{{ t.total_amount.toFixed(1) }} kr</span>
        <span class="text-xs opacity-70">{{ t.source ?? '' }}</span>
      </li>
      <li v-if="!transactions.length" class="text-sm italic opacity-60">No transactions yet</li>
    </ul>
  </div>
</template>
