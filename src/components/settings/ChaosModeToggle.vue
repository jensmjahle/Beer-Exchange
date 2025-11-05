<template>
  <div class="flex items-center w-full gap-2 cursor-pointer select-none">
    <input
      id="chaos-toggle"
      type="checkbox"
      v-model="enabled"
      class="hidden peer"
    />
    <label
      for="chaos-toggle"
      class="flex items-center gap-2 px-3 py-2 rounded-lg border border-button2-border text-button2-meta w-full bg-button2 hover:bg-button2-hover transition-all"
    >
      <span class="text-lg">🍺</span>
      <span class="font-medium">Opp ned?</span>
      <span v-if="enabled" class="text-sm text-green-500 font-semibold ml-1"
        >PÅ</span
      >
      <span v-else class="text-sm text-button2-meta ml-1">AV</span>
    </label>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

const enabled = ref(false);

// Ved oppstart – sjekk om brukeren har hatt det aktivert
onMounted(() => {
  const saved = localStorage.getItem("chaosMode");
  if (saved === "true") {
    enabled.value = true;
    document.body.classList.add("upside-down");
  }
});

// Lytt på endringer
watch(enabled, (val) => {
  document.body.classList.toggle("upside-down", val);
  localStorage.setItem("chaosMode", val);
});
</script>

<style scoped>
/* Litt visuell flair */
label {
  transition: all 0.3s ease;
}

/* Når PÅ: gjør knappen litt sprø */
.peer:checked + label {
  transform: rotate(-2deg);
  background-color: var(--color-bg2);
  box-shadow: 0 0 12px rgba(255, 200, 0, 0.4);
}
</style>

<!-- Global stil legges gjerne i app.css eller main.css -->
<style>
body.upside-down {
  transform: rotate(180deg);
  transition: transform 0.8s ease-in-out;
  transform-origin: center center;
}
</style>
