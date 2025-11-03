<template>
  <div class="p-4 rounded-lg bg-bg2  text-text2 shadow">
    <h2 class="text-lg font-semibold mb-3">{{ title }}</h2>
    <ul class="space-y-2">
      <li
        v-for="beer in items"
        :key="beer.id"
        class="flex justify-between  text-text3 items-center bg-bg3 p-2 rounded border"
      >
        <span>{{ beer.name }}</span>
        <span
          class="font-semibold"
          :class="{
            'text-green-600': (beer.last_hours_change ?? 0) > 0,
            'text-red-600': (beer.last_hours_change ?? 0) < 0,
            'text-gray-500': (beer.last_hours_change ?? 0) === 0
          }"
        >
          {{ beer.last_hours_change > 0 ? '+' : '' }}
          {{ beer.last_hours_change?.toFixed(1) ?? '0.0' }}%
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  items: {
    type: Array,
    default: () => [],
  },
});
</script>
