<script setup xmlns="http://www.w3.org/1999/html">
import { ref } from "vue";
import { createCustomer } from "@/services/customers.service.js";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseDropdown from "@/components/base/BaseDropdown.vue";
import { useConfirmDialog } from "@/composables/useConfirmDialog.js";

const { showConfirm } = useConfirmDialog();

const props = defineProps({
  open: { type: Boolean, default: false },
  eventId: { type: String, required: true },
});

const emit = defineEmits(["close", "created"]);

// form state
const name = ref("");
const phone = ref("");
const shoe_size = ref("");
const weight = ref("");
const work_relationship = ref("");
const gender = ref("");
const sexual_orientation = ref("");
const ethnicity = ref(50); // 0=dark brown, 50=white, 100=yellow
const profile_image = ref(null);
const profile_preview = ref(null);

const loading = ref(false);

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const workRelOptions = [
  { label: "Fulltidsjobb", value: "fulltidsjobb" },
  { label: "Deltidsjobb", value: "deltidsjobb" },
  { label: "Student", value: "student" },
  { label: "Arbeidsledig", value: "arbeidsledig" },
];

const orientations = [
  "Hetero",
  "Homo",
  "Bi",
  "Pan",
  "Asexual",
  "Queer",
  "Fluid",
  "Demiseksuell",
  "Sapioseksuell",
  "Aromantic",
  "Polyseksuell",
  "Gnomoseksuell",
  "Homo utover kvelden",
];

function randomOrientation() {
  sexual_orientation.value =
    orientations[Math.floor(Math.random() * orientations.length)];
}

function onFileChange(e) {
  const f = e.target.files?.[0];
  if (f) {
    profile_image.value = f;
    profile_preview.value = URL.createObjectURL(f);
  }
}

async function onSubmit() {
  if (!name.value.trim()) {
    return alert("Name is required");
  }
  if (!weight.value) {
    return alert("Weight is required");
  }
  if (!gender.value) {
    return alert("Gender is required");
  }

  // 🧠 Bekreftelse før opprettelse
  const confirmed = await showConfirm({
    title: "Er du HELT sikker?",
    message:
      "Det er UMULIG å endre dette senere. " +
      "Når du trykker bekreft, er kunden registrert for evig tid. " +
      "Tenk deg om før du gjør det – vi gjør det ikke for deg.",
    confirmText: "Kjør på 💀",
    cancelText: "Vent litt...",
  });

  if (!confirmed) return;

  try {
    loading.value = true;
    const form = new FormData();
    form.append("name", name.value.trim());
    if (phone.value) form.append("phone", phone.value);
    if (shoe_size.value) form.append("shoe_size", shoe_size.value);
    if (weight.value) form.append("weight", weight.value);
    if (work_relationship.value)
      form.append("work_relationship", work_relationship.value);
    if (gender.value) form.append("gender", gender.value);
    if (sexual_orientation.value)
      form.append("sexual_orientation", sexual_orientation.value);
    form.append("ethnicity", ethnicity.value.toString());
    if (profile_image.value) form.append("image", profile_image.value);

    const c = await createCustomer(props.eventId, form, true);
    emit("created", c);
    reset();
    emit("close");
  } catch (e) {
    alert(e?.message || "Failed to add customer");
  } finally {
    loading.value = false;
  }
}

function reset() {
  name.value = "";
  phone.value = "";
  shoe_size.value = "";
  weight.value = "";
  work_relationship.value = "";
  gender.value = "";
  sexual_orientation.value = "";
  ethnicity.value = 50;
  profile_image.value = null;
  profile_preview.value = null;
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-10 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
      class="relative z-10 w-[min(460px,92vw)] rounded-2xl border bg-bg4 p-5 max-h-[90vh] overflow-y-auto"
    >
      <h3 class="text-lg font-extrabold mb-4">Ny kunde</h3>

      <div class="space-y-4">
        <!-- Name -->
        <BaseInput
          v-model="name"
          label="Full name"
          type="text"
          required
          placeholder="John Doe"
        />

        <!-- Phone -->
        <BaseInput
          v-model="phone"
          label="Phone"
          type="text"
          placeholder="Phone (optional)"
        />

        <div class="grid grid-cols-2 gap-3">
          <!-- Shoe size -->
          <BaseInput
            v-model="shoe_size"
            label="Shoe size (EU)"
            help="You can write e.g. 43 or 45"
            type="number"
            placeholder="e.g. 43"
          />
          <!-- Weight (required) -->
          <BaseInput
            v-model.number="weight"
            label="Weight"
            help="You can write e.g. 82 or 82 kg"
            type="number"
            required
            placeholder="e.g. 82"
          />
        </div>

        <!-- Work relationship -->
        <BaseDropdown
          v-model="work_relationship"
          :options="workRelOptions"
          label="Work relationship"
          placeholder="— Select —"
          class="w-full"
        />

        <!-- Gender (required) -->
        <BaseDropdown
          v-model="gender"
          :options="genderOptions"
          label="Gender"
          placeholder="— Select —"
          class="w-full"
        />

        <!-- Sexual orientation + random -->
        <div>
          <label class="mb-1 block text-sm font-medium"
            >Sexual orientation</label
          >
          <div class="flex gap-2">
            <BaseInput
              v-model="sexual_orientation"
              type="text"
              placeholder="Optional"
              class="flex-1"
            />
            <BaseButton
              variant="button4"
              type="button"
              @click="randomOrientation"
              >🎲</BaseButton
            >
          </div>
        </div>

        <!-- Ethnicity slider -->
        <div>
          <label class="mb-1 block text-sm font-medium">Ethnicity</label>
          <input
            v-model="ethnicity"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full h-3 rounded-lg appearance-none cursor-pointer bg-bg2"
            :style="{
              background:
                'linear-gradient(to right, #4b2e2b 0%, #ffffff 50%, #f5e642 100%)',
            }"
          />
          <div class="mt-1 text-xs opacity-70">Value: {{ ethnicity }}</div>
        </div>

        <!-- Profile image -->
        <div>
          <label class="mb-1 block text-sm font-medium">Profile image</label>
          <input
            type="file"
            accept="image/*"
            @change="onFileChange"
            class="w-full text-sm"
          />
          <div v-if="profile_preview" class="mt-2">
            <img
              :src="profile_preview"
              alt="Preview"
              class="block max-h-32 max-w-full rounded-lg border object-cover"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <BaseButton variant="button4" @click="$emit('close')"
          >Avbryt</BaseButton
        >
        <BaseButton variant="button1" :disabled="loading" @click="onSubmit">
          {{ loading ? "Adding..." : "Legg til" }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
