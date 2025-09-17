<template>
  <router-link
    :to="to"
    class=" px-2 border-b-button1-border border-b-2 hover:scale-105 transition-colors"
    :class="{ 'text-button1': isActive }"
  >

      <h1 class="text-text1 hover:text-button1 transition-colors">
           {{ $t(labelKey) }}
      </h1>

  </router-link>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from "vue";

const props = defineProps({
  to: { type: String, required: true },
  labelKey: { type: String, required: true },
})

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>