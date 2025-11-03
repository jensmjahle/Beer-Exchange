<template>
  <div class="modal" v-if="visible">
    <div class="modal-content">
      <h2>Legg til ny øl</h2>
      <label>Navn</label>
      <input v-model="beer.name" placeholder="Navn" />

      <label>Basepris (literpris)</label>
      <input
        type="number"
        v-model.number="beer.base_price"
        placeholder="NOK per liter"
      />

      <label>Min pris</label>
      <input type="number" v-model.number="beer.min_price" />

      <label>Maks pris</label>
      <input type="number" v-model.number="beer.max_price" />

      <label>Startpris</label>
      <input type="number" v-model.number="beer.current_price" />

      <label>Volumer (kommaseparert, ml)</label>
      <input v-model="volumesInput" placeholder="330, 500" />

      <label>Bryggeri</label>
      <input v-model="beer.brewery" placeholder="Bryggeri" />

      <label>Stil</label>
      <input v-model="beer.style" placeholder="Stil" />

      <label>ABV</label>
      <input v-model.number="beer.abv" type="number" step="0.1" />

      <div class="actions">
        <button @click="save">Lagre</button>
        <button @click="close">Avbryt</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { attachBeerToEvent } from "@/services/beers.service";

const props = defineProps({
  visible: Boolean,
  eventId: String,
});
const emit = defineEmits(["close", "saved"]);

const beer = ref({
  name: "",
  beer_id: "",
  base_price: 0,
  min_price: 0,
  max_price: 0,
  current_price: 0,
  brewery: "",
  style: "",
  abv: null,
  active: 1,
});

const volumesInput = ref("");

async function save() {
  try {
    const volumes = volumesInput.value
      .split(",")
      .map((v) => ({ volume_ml: Number(v.trim()) }))
      .filter((v) => v.volume_ml > 0);

    const res = await attachBeerToEvent(props.eventId, {
      ...beer.value,
      volumes,
    });
    emit("saved", res);
    close();
  } catch (e) {
    console.error("Feil ved lagring av øl:", e);
    alert("Kunne ikke lagre ølen.");
  }
}

function close() {
  emit("close");
}
</script>

<style scoped>
.modal {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center;
}
.modal-content {
  @apply bg-white p-6 rounded-2xl shadow-xl w-96;
}
.actions {
  @apply mt-4 flex justify-end gap-2;
}
input {
  @apply border rounded px-2 py-1 w-full mb-2;
}
</style>
