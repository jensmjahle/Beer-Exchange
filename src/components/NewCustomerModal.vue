<script setup>
import { ref } from 'vue'
import { createCustomer } from '@/services/customers.service.js'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDropdown from '@/components/base/BaseDropdown.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  eventId: { type: String, required: true },
})

const emit = defineEmits(['close', 'created'])

// form state
const name = ref('')
const phone = ref('')
const shoe_size = ref('')
const weight = ref('')
const work_relationship = ref('')
const gender = ref('')
const sexual_orientation = ref('')
const ethnicity = ref(50) // 0=dark brown, 50=white, 100=yellow
const profile_image = ref(null)
const profile_preview = ref(null)

const loading = ref(false)

const orientations = [
  'Hetero',
  'Homo',
  'Bi',
  'Pan',
  'Asexual',
  'Queer',
  'Fluid',
  'Demiseksuell',
  'Sapioseksuell',
  'Aromantic',
  'Polyseksuell',
  'Gnomoseksuell',
  'Homo utover kvelden',
]

function randomOrientation() {
  sexual_orientation.value =
    orientations[Math.floor(Math.random() * orientations.length)]
}

function onFileChange(e) {
  const f = e.target.files?.[0]
  if (f) {
    profile_image.value = f
    profile_preview.value = URL.createObjectURL(f)
  }
}

async function onSubmit() {
  if (!name.value.trim()) return alert('Name is required')
  if (!weight.value) return alert('Weight is required')
  if (!gender.value) return alert('Gender is required')

  try {
    loading.value = true
    const form = new FormData()
    form.append('name', name.value.trim())
    if (phone.value) form.append('phone', phone.value)
    if (shoe_size.value) form.append('shoe_size', shoe_size.value)
    if (weight.value) form.append('weight', weight.value)
    if (work_relationship.value) form.append('work_relationship', work_relationship.value)
    if (gender.value) form.append('gender', gender.value)
    if (sexual_orientation.value) form.append('sexual_orientation', sexual_orientation.value)
    form.append('ethnicity', ethnicity.value.toString())
    if (profile_image.value) form.append('image', profile_image.value)

    const c = await createCustomer(props.eventId, form, true)
    emit('created', c)
    reset()
    emit('close')
  } catch (e) {
    alert(e?.message || 'Failed to add customer')
  } finally {
    loading.value = false
  }
}

function reset() {
  name.value = ''
  phone.value = ''
  shoe_size.value = ''
  weight.value = ''
  work_relationship.value = ''
  gender.value = ''
  sexual_orientation.value = ''
  ethnicity.value = 50
  profile_image.value = null
  profile_preview.value = null
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
      class="relative z-10 w-[min(460px,92vw)] rounded-2xl border bg-[var(--color-button4)] p-5 max-h-[90vh] overflow-y-auto"
    >
      <h3 class="text-lg font-bold mb-4">New Customer</h3>

      <div class="space-y-3">
        <!-- name -->
        <BaseInput v-model="name" type="text" placeholder="Name" />

        <!-- phone -->
        <BaseInput v-model="phone" type="text" placeholder="Phone (optional)" />

        <!-- shoe size -->
        <BaseInput v-model="shoe_size" type="number" placeholder="Shoe size (EU)" />

        <!-- weight (required) -->
        <BaseInput v-model="weight" type="number" required placeholder="Weight (kg)" />

        <!-- work relationship -->
        <BaseDropdown v-model="work_relationship">
          <option value="">— Work relationship —</option>
          <option value="fulltidsjobb">Fulltidsjobb</option>
          <option value="deltidsjobb">Deltidsjobb</option>
          <option value="student">Student</option>
          <option value="arbeidsledig">Arbeidsledig</option>
        </BaseDropdown>

        <!-- gender (required) -->
        <BaseDropdown v-model="gender" required>
          <option disabled value="">— Gender —</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </BaseDropdown>

        <!-- sexual orientation -->
        <div class="flex gap-2">
          <BaseInput
            v-model="sexual_orientation"
            type="text"
            placeholder="Sexual orientation"
            class="flex-1"
          />
          <BaseButton variant="button4" type="button" @click="randomOrientation">🎲</BaseButton>
        </div>

        <!-- ethnicity -->
        <div>
          <label class="block text-sm mb-1">Ethnicity</label>
          <input
            v-model="ethnicity"
            type="range"
            min="0"
            max="100"
            step="1"
            class="w-full h-2 rounded-lg appearance-none cursor-pointer"
            :style="{
              background: 'linear-gradient(to right, #4b2e2b 0%, #ffffff 50%, #f5e642 100%)',
            }"
          />
        </div>

        <!-- profile image -->
        <div>
          <input type="file" accept="image/*" @change="onFileChange" class="w-full text-sm" />
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
        <BaseButton variant="button4" @click="$emit('close')">Cancel</BaseButton>
        <BaseButton variant="button1" :disabled="loading" @click="onSubmit">
          {{ loading ? 'Adding...' : 'Add' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
