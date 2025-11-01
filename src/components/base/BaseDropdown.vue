<template>
  <div class="w-full">
    <!-- 🔹 Label -->
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-text2 mb-1"
    >
      {{ label }}
    </label>

    <!-- 🔹 Select -->
    <select
      :id="id"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="w-full rounded-lg border px-3 py-2 border-border4 text-text4
             bg-bg4 focus:outline-none focus:ring-2 focus:ring-border4
             transition placeholder:text-text3 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option disabled value="">
        {{ placeholder }}
      </option>

      <option
        v-for="opt in options"
        :key="opt[valueKey]"
        :value="opt[valueKey]"
      >
        {{ opt[labelKey] }}
      </option>
    </select>

    <!-- 🔹 Description -->
    <p
      v-if="description"
      class="text-xs text-text3 mt-1 leading-tight"
    >
      {{ description }}
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '-- velg --' },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  labelKey: { type: String, default: 'label' },
  valueKey: { type: String, default: 'value' },
  id: {
    type: String,
    default: () => `dropdown-${Math.random().toString(36).slice(2, 8)}`,
  },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
/* Matcher BaseInput-stilen nøyaktig */
select {
  @apply w-full rounded-lg border px-3 py-2 border-border4 text-text4 bg-bg4
         focus:outline-none focus:ring-2 focus:ring-border4 transition
         placeholder:text-text3 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
