<script setup>
import { ref } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDropdown from '@/components/base/BaseDropdown.vue'
import { attachBeerToEvent } from '@/services/beers.service.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  eventId: { type: String, required: true },
})

const emit = defineEmits(['close', 'created'])

const beer_id = ref('')
const name = ref('')
const volume_ml = ref('')
const abv = ref('')
const description = ref('')
const brewery = ref('')
const style = ref('')
const ibu = ref('')
const image_url = ref('')
const base_price = ref('')
const min_price = ref('')
const max_price = ref('')
const current_price = ref('')

const loading = ref(false)

async function onSubmit() {
  if (!volume_ml.value) return alert('Volume is required')
  if (!abv.value) return alert('ABV is required')
  if (!base_price.value || !min_price.value || !max_price.value || !current_price.value) {
    return alert('All price fields are required')
  }

  try {
    loading.value = true
    const beer = {
      beer_id: beer_id.value || crypto.randomUUID(),
      name: name.value,
      volume_ml: Number(volume_ml.value),
      abv: Number(abv.value),
      description: description.value,
      brewery: brewery.value,
      style: style.value,
      ibu: ibu.value ? Number(ibu.value) : null,
      image_url: image_url.value,
      base_price: Number(base_price.value),
      min_price: Number(min_price.value),
      max_price: Number(max_price.value),
      current_price: Number(current_price.value),
      position: 0,
      active: 1,
    }

    const row = await attachBeerToEvent(props.eventId, beer)
    emit('created', row)
    reset()
    emit('close')
  } catch (e) {
    alert(e?.message || 'Failed to add beer')
  } finally {
    loading.value = false
  }
}

function reset() {
  beer_id.value = ''
  name.value = ''
  volume_ml.value = ''
  abv.value = ''
  description.value = ''
  brewery.value = ''
  style.value = ''
  ibu.value = ''
  image_url.value = ''
  base_price.value = ''
  min_price.value = ''
  max_price.value = ''
  current_price.value = ''
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="relative z-10 w-[min(560px,92vw)] rounded-2xl border bg-bg2 p-5 max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">{{ $t('add_new_beer') }}</h3>

      <div class="space-y-3">
        <BaseInput v-model="name" type="text" :placeholder="$t('beer_name')" />
        <BaseInput v-model="brewery" type="text" :placeholder="$t('brewery')" />
        <BaseInput v-model="style" type="text" :placeholder="$t('style')" />
        <BaseInput v-model="description" type="text" :placeholder="$t('description')" />

        <BaseInput v-model="volume_ml" type="number" required :placeholder="$t('volume_ml')" />
        <BaseInput v-model="abv" type="number" step="0.1" required :placeholder="$t('abv_percent')" />
        <BaseInput v-model="ibu" type="number" :placeholder="$t('ibu')" />

        <BaseInput v-model="image_url" type="text" :placeholder="$t('image_url')" />

        <!-- Pricing -->
        <BaseInput v-model="base_price" type="number" step="0.1" required :placeholder="$t('base_price')" />
        <BaseInput v-model="min_price" type="number" step="0.1" required :placeholder="$t('min_price')" />
        <BaseInput v-model="max_price" type="number" step="0.1" required :placeholder="$t('max_price')" />
        <BaseInput v-model="current_price" type="number" step="0.1" required :placeholder="$t('current_price')" />
      </div>

      <div class="flex justify-end gap-2 mt-5">
        <BaseButton variant="button4" @click="$emit('close')">{{ $t('cancel') }}</BaseButton>
        <BaseButton variant="button1" :disabled="loading" @click="onSubmit">
          {{ loading ? $t('adding') : $t('add') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
