<template>
  <div
    class="flex flex-col h-screen w-screen overflow-hidden bg-bg1 text-text1 divide-y divide-border1/10"
  >
    <!-- Top Section -->
    <section class="flex flex-[1] items-center justify-center">
      <slot name="top">
        <div class="flex flex-row items-center align-middle gap-4">
          <h1 class="text-4xl md:text-6xl font-bold">
            {{ ev?.name ?? "Beer Exchange" }}
          </h1>
            <LiveIndicator />
        </div>
      </slot>
    </section>

    <!-- Middle Section -->
    <section class="flex flex-[3] items-center justify-center">
      <slot name="middle">
        <h1 class="text-4xl md:text-6xl font-bold text-center">
          Middle Section
        </h1>
      </slot>
    </section>

    <!-- Bottom Section -->
    <section class="flex flex-[3] items-center justify-center">
      <slot name="bottom">
        <h1 class="text-4xl md:text-6xl font-bold text-center">
          Bottom Section
        </h1>
      </slot>
    </section>
  </div>
</template>

<script setup>
import LiveIndicator from "@/components/LiveIndicator.vue";
import { onMounted, ref } from "vue";
import { getEvent } from "@/services/events.service.js";
import { useRoute } from "vue-router";

const route = useRoute();
const ev = ref(null);
const eventId = String(route.params.eventId || "");

onMounted(async () => {
  try {
    ev.value = await getEvent(eventId);
  } catch (err) {
    console.error("Failed to load event:", err);
  }
});
</script>
