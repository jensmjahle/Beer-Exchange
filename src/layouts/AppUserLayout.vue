<template>
  <div class="flex min-h-screen pt-6 flex-col gap-4">
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

