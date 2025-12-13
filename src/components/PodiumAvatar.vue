<template>
  <div class="flex flex-col items-center text-center">
    <!-- større bilde -->
    <div
      class="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg mb-3"
    >
      <img :src="assetUrl(entry.profile_image_url)" alt="" class="w-full h-full object-cover" />
    </div>

    <!-- større tekst -->
    <div class="font-bold text-xl truncate w-32">{{ entry.name }}</div>
    <div class="text-lg opacity-80 font-medium">
      {{ Number(entry.score).toFixed(1) }}{{ unit }}
    </div>
  </div>
</template>

<script setup>
import {useAssetUrl} from "@/composables/useAssetUrl.js";

defineProps({
  entry: { type: Object, required: true },
  place: { type: Number, required: true },
  unit: { type: String, default: "" },
});

const {assetUrl} = useAssetUrl();
</script>
