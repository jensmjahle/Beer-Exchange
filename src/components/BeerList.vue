<template>
  <div class="p-4 rounded-2xl border bg-bg2 border-border2">
    <!-- Header -->
    <div class="flex flex-row items-center justify-between mb-4">
      <h2 class="text-4xl font-bold">{{ title }}</h2>
      <LiveIndicator />
    </div>

    <!-- Øl-liste -->
    <ul class="space-y-2">
      <li
        v-for="beer in beers"
        :key="beer.id"
        class="flex justify-between items-center p-3 rounded-xl border border-border3 bg-bg3 hover:bg-bg4 transition"
      >
        <!-- Venstre side -->
        <div class="flex flex-col">
          <div class="text-3xl font-semibold">{{ beer.name }}</div>
          <div class="text-xl opacity-70">
            {{ beer.style }} · {{ beer.abv }}% ABV
          </div>
        </div>

        <!-- Høyre side -->
        <div class="flex flex-col items-end">
          <div class="text-3xl font-bold">
            {{ formatPrice(beer.current_price, currency) }}
          </div>

          <div class="text-lg font-semibold text-text1">
            Over-/Underpriset:
            <span
              :class="{
                'text-green-500': priceDelta(beer) > 0,
                'text-red-500': priceDelta(beer) < 0,
                'text-gray-400': priceDelta(beer) === 0,
              }"
            >
              {{ priceDelta(beer) > 0 ? "+" : "" }}
              {{ priceDelta(beer).toFixed(1) }}%
            </span>
          </div>
        </div>
      </li>
    </ul>

    <div
      v-if="!beers.length"
      class="text-center text-sm opacity-60 italic mt-3"
    >
      Ingen øl funnet.
    </div>
  </div>
</template>

<script setup>
import LiveIndicator from "@/components/LiveIndicator.vue";

defineProps({
  title: { type: String, required: true },
  beers: { type: Array, default: () => [] },
  currency: { type: String, default: "NOK" },
});

// prosentavvik fra basepris
function priceDelta(beer) {
  if (!beer.base_price) return 0;
  return ((beer.current_price - beer.base_price) / beer.base_price) * 100;
}

// prisformatering
function formatPrice(value, currency) {
  if (value == null) return "-";
  return `${value.toFixed(1)} ${currency}`;
}
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
