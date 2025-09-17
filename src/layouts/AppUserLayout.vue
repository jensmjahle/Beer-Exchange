<template>
  <div class="flex min-h-screen flex-col gap-4">
    <NavBar />
    <div class="flex flex-grow align-middle justify-center flex-1">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import NavBar from '@/components/navigation/NavBar.vue'
import Footer from "@/components/Footer.vue";
</script>

