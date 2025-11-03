<script setup lang="ts">
import { computed, useAttrs } from "vue";

const props = defineProps<{
  modelValue: string | number | null | undefined;
  label?: string;
  help?: string;
  error?: string;
  id?: string;
  required?: boolean;
  type?: string;
  /** Enables v-model.number */
  modelModifiers?: { number?: boolean };
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string | number | null): void;
}>();

// Stable id for label "for" if none provided
const computedId = computed(
  () => props.id || `fi-${Math.random().toString(36).slice(2, 9)}`,
);

// Pass through all attrs except `id` (we control it)
const attrs = useAttrs();
const mergedAttrs = computed(() => {
  const { id: _ignore, ...rest } = (attrs as Record<string, any>) || {};
  return rest;
});

function onInput(e: Event) {
  const el = e.target as HTMLInputElement;
  let val: string | number = el.value;
  if (props.modelModifiers?.number) {
    const n = Number(val);
    val = Number.isNaN(n) ? ("" as any) : n;
  }
  emit("update:modelValue", val);
}
</script>

<template>
  <div class="w-full">
    <!-- Header / label -->
    <label
      v-if="label"
      :for="computedId"
      class="mb-1 block text-sm font-medium text-[var(--color-text1)]"
    >
      {{ label }}
      <span v-if="required" class="text-[var(--color-danger)]">*</span>
    </label>

    <!-- Optional help -->
    <p v-if="help" class="mb-2 text-xs text-[var(--color-text2-faded)]">
      {{ help }}
    </p>

    <!-- Input -->
    <input
      v-bind="mergedAttrs"
      :id="computedId"
      :type="type || 'text'"
      :value="modelValue"
      @input="onInput"
      class="w-full rounded-lg bg-bg4 text-text4 border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-button1 border-border4"
      :class="error ? 'border-danger-border' : ''"
    />

    <!-- Error -->
    <p v-if="error" class="mt-1 text-xs text-danger">
      {{ error }}
    </p>
  </div>
</template>
