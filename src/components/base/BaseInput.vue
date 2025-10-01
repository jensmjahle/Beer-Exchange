<template>
  <input
    v-bind="$attrs"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    class="w-full rounded-lg border px-3 py-2 ..."
  />
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
})
defineEmits(['update:modelValue'])
</script>
