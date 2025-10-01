<template>
  <div class="live-indicator">
    <span class="dot"></span>
    <span class="label">Live</span>
  </div>
</template>

<script>
export default {
  name: "LiveIndicator",
};
</script>

<style scoped>
.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #16a34a;
}

.dot {
  width: 12px;
  height: 12px;
  background-color: #16a34a;
  border-radius: 50%;
  position: relative;
}

.dot::after {
  content: "";
  position: absolute;
  top: -4px;
  left: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(22, 163, 74, 0.5);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
