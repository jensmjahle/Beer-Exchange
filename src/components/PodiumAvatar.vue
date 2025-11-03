<template>
  <div class="flex flex-col items-center text-center">
    <div
      class="w-20 h-20 rounded-full overflow-hidden border-4 border-border1 shadow-lg mb-2"
    >
      <img :src="entry.image" alt="" class="w-full h-full object-cover" />
    </div>
    <div class="font-semibold text-sm truncate w-24">{{ entry.name }}</div>
    <div class="text-xs opacity-70 font-medium">
      {{ entry.score.toFixed(1) }}{{ unit }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  entry: { type: Object, required: true },
  place: { type: Number, required: true },
  unit: { type: String, default: "" },
});
</script>
