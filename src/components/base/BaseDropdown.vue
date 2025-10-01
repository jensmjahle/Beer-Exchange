<template>
  <select
    v-bind="$attrs"
    :value="modelValue"
    @change="$emit('update:modelValue', $event.target.value)"
    class="w-full rounded-lg border px-3 py-2 border-border3
           bg-bg4 focus:outline-none focus:ring-2
           focus:ring-button1"
  >
    <slot />
  </select>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
})
defineEmits(['update:modelValue'])
</script>
