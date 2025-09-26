<template>
  <div class="flex min-h-screen pt-6 flex-col gap-4">
    <SettingsWidget class="fixed top-0 right-0 z-50 p-6 sm:block"></SettingsWidget>
    <div class="flex flex-grow align-middle justify-center flex-1">
      <router-view />
    </div>
    <Footer />
  </div>
</template>


<script setup>

import Footer from "@/components/Footer.vue";
import SettingsWidget from "@/components/settings/SettingsWidget.vue";
</script>

