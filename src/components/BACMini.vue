<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  calculateCustomerBACFromTransactions, 
  getBACStatus 
} from '@/services/bac.service.js'

const props = defineProps({
  customer: { type: Object, required: true },
  eventId: { type: String, required: true },
  size: { type: String, default: 'small' } // 'mini', 'small', 'medium'
})

const bacData = ref(null)
const loading = ref(false)

const bacStatus = computed(() => {
  if (!bacData.value) return null
  return getBACStatus(bacData.value.bac)
})

const bacDisplay = computed(() => {
  if (!bacData.value || isNaN(bacData.value.bac)) return '---'
  if (bacData.value.bac === 0) return '0.00'
  // Convert percentage to promille (multiply by 10)
  const promille = bacData.value.bac * 10
  return promille.toFixed(2)
})

const statusIcon = computed(() => {
  if (!bacStatus.value) return '⚪'
  switch (bacStatus.value.level) {
    case 'sober': return '✅'
    case 'minimal': return '🟢'
    case 'light': return '🟡'
    case 'moderate': return '🟠'
    case 'high': return '🔴'
    case 'severe': return '🚨'
    default: return '⚪'
  }
})

async function calculateBAC() {
  if (!props.customer || !props.eventId) return
  
  loading.value = true
  try {
    bacData.value = await calculateCustomerBACFromTransactions(
      props.customer, 
      props.eventId
    )
  } catch (e) {
    console.error('Mini BAC calculation error:', e)
    bacData.value = { bac: 0, error: true }
  } finally {
    loading.value = false
  }
}

onMounted(calculateBAC)
</script>

<template>
  <div 
    class="bac-mini inline-flex items-center gap-1"
    :class="{
      'text-xs': size === 'mini',
      'text-sm': size === 'small',
      'text-base': size === 'medium'
    }"
  >
    <span v-if="loading" class="opacity-50">⏳</span>
    <span v-else>{{ statusIcon }}</span>
    
    <span 
      class="font-mono font-medium"
      :style="{ color: bacStatus?.color }"
    >
      {{ bacDisplay }}‰
    </span>
    
    <span v-if="!loading && !bacStatus?.canDrive && bacData?.bac > 0" class="opacity-70">
      🚫
    </span>
  </div>
</template>