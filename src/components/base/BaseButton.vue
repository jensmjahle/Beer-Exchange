<template>
  <button
    v-bind="$attrs"
    @click="$emit('click', $event)"
    :class="[
      'rounded-lg px-3 py-1.5 border font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      variant === 'button1'
        ? 'bg-[var(--color-button1)] hover:bg-[var(--color-button1-hover)] text-button1-meta border-button1-border focus:ring-[var(--color-button1)]'
        : variant === 'button2'
        ? 'bg-[var(--color-button2)] hover:bg-[var(--color-button2-hover)] text-button2-meta border-button2-border focus:ring-[var(--color-button2)]'
        : variant === 'button3'
        ? 'bg-[var(--color-button3)] hover:bg-[var(--color-button3-hover)] text-button3-meta border-button3-border focus:ring-[var(--color-button3)]'
        : variant === 'button4'
        ? 'bg-[var(--color-button4)] hover:bg-[var(--color-button4-hover)] text-button4-meta border-button4-border focus:ring-[var(--color-button4)]'
        : ''
    ]"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'button1', // "button1" | "button2" | "button3" | "button4"
  },
})
defineEmits(['click'])
</script>
