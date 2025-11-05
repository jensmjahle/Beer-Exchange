<template>
  <div class="flex min-h-screen p-4 flex-col gap-4">
    <div class="flex flex-grow align-middle justify-center flex-1">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Footer from "@/components/Footer.vue";
</script>
