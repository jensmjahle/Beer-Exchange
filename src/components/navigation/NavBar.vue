<template>
  <nav
    class="sticky top-0 bg-bg1-gradient shadow-2xl border-b-2 border-b-border1 py-2 px-4 flex items-center"
  >
    <div class="flex-1 flex items-center">
      <p>logo</p>
    </div>

    <div class="flex gap-6">
      <NavButton to="/admin" labelKey="navbar.home" />
      <NavButton to="/games" labelKey="navbar.games" />
      <NavButton to="/admin/events" labelKey="navbar.events" />
    </div>

    <div class="flex-1 flex items-center justify-end gap-4">
      <SettingsWidget />
    </div>
  </nav>
</template>

<script setup>
import NavButton from "@/components/navigation/NavButton.vue";
import SettingsWidget from "@/components/settings/SettingsWidget.vue";
</script>
