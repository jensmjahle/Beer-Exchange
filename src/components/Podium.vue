<template>
  <div class="podium-container flex flex-col items-center">
    <h2 class="text-3xl font-extrabold text-center mb-2">{{ title }}</h2>

    <div class="relative flex items-end justify-center gap-6 h-64">
      <!-- 2. plass -->
      <div
        v-if="entries[1]"
        class="flex flex-col items-center justify-end relative"
        style="z-index: 1"
      >
        <div
          class="podium-block bg-gray-300 text-black rounded-t-lg w-28 flex flex-col items-center justify-end"
          style="height: 120px"
        >
          <PodiumAvatar
            :entry="entries[1]"
            :place="2"
            :unit="unit"
            class="translate-y-[-26%]"
          />
          <div class="absolute bottom-2 text-xl font-bold text-gray-800">2</div>
        </div>
      </div>

      <!-- 1. plass -->
      <div
        v-if="entries[0]"
        class="flex flex-col items-center justify-end relative"
        style="z-index: 2"
      >
        <div
          class="podium-block bg-yellow-400 text-black rounded-t-lg w-32 flex flex-col items-center justify-end"
          style="height: 160px"
        >
          <PodiumAvatar
            :entry="entries[0]"
            :place="1"
            :unit="unit"
            class="translate-y-[-35%]"
          />
          <div class="absolute bottom-2 text-2xl font-extrabold text-gray-900">
            1
          </div>
        </div>
      </div>

      <!-- 3. plass -->
      <div
        v-if="entries[2]"
        class="flex flex-col items-center justify-end relative"
        style="z-index: 1"
      >
        <div
          class="podium-block bg-amber-600 text-black rounded-t-lg w-28 flex flex-col items-center justify-end"
          style="height: 100px"
        >
          <PodiumAvatar
            :entry="entries[2]"
            :place="3"
            :unit="unit"
            class="translate-y-[-20%]"
          />
          <div class="absolute bottom-2 text-xl font-bold text-gray-50">3</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PodiumAvatar from "./PodiumAvatar.vue";

defineProps({
  title: { type: String, required: true },
  unit: { type: String, default: "" },
  entries: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.podium-block {
  position: relative;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}
</style>
