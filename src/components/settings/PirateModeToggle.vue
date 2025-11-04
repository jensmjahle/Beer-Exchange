<template>
  <div class="flex items-center gap-2 cursor-pointer select-none">
    <input
      id="pirate-toggle"
      type="checkbox"
      v-model="enabled"
      class="hidden peer"
    />
    <label
      for="pirate-toggle"
      class="flex items-center gap-2 px-3 py-2 rounded-lg border border-border3 bg-bg3 hover:bg-bg4 transition-all"
    >
      <span>🏴‍☠️</span>
      <span class="font-medium">Pirate mode</span>
      <span v-if="enabled" class="text-sm text-green-500 font-semibold ml-1"
        >ON</span
      >
      <span v-else class="text-sm text-gray-400 ml-1">OFF</span>
    </label>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

const enabled = ref(false);

// enkel ordbok (kan utvides fritt)
const dictionary = {
  Beer: "Grog",
  beer: "grog",
  Price: "Bounty",
  price: "bounty",
  Buy: "Plunder",
  Kjøp: "Plunder",
  Sell: "Trade yer loot",
  Market: "Port",
  Balance: "Treasure chest",
  "Top winners": "Top Buccaneers",
  "Top losers": "Landlubbers",
  Join: "Board the ship",
  Welcome: "Ahoy",
  Logout: "Abandon ship",
};

// husk originalt HTML-innhold
let originalHTML = "";

function applyPirateMode() {
  if (!originalHTML) originalHTML = document.body.innerHTML;
  let pirateHTML = originalHTML;
  for (const [key, value] of Object.entries(dictionary)) {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    pirateHTML = pirateHTML.replace(regex, value);
  }
  document.body.innerHTML = pirateHTML;
}

function disablePirateMode() {
  if (originalHTML) document.body.innerHTML = originalHTML;
}

// ved last
onMounted(() => {
  const saved = localStorage.getItem("pirateMode");
  if (saved === "true") {
    enabled.value = true;
    applyPirateMode();
  }
});

// lytte på endring
watch(enabled, (val) => {
  if (val) {
    applyPirateMode();
  } else {
    disablePirateMode();
  }
  localStorage.setItem("pirateMode", val);
});
</script>

<style scoped>
label {
  transition: all 0.3s ease;
}
.peer:checked + label {
  transform: rotate(-1deg);
  background-color: var(--color-bg2);
  box-shadow: 0 0 12px rgba(255, 200, 0, 0.4);
}
</style>
