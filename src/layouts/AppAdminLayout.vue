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
import NavBar from "@/components/navigation/NavBar.vue";

import {onMounted, onUnmounted} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from "vue-i18n";
import Footer from "@/components/Footer.vue";
const { t } = useI18n()

const router = useRouter();

onMounted(() => {
  const token = sessionStorage.getItem('jwt');
  if (!token) return;

});



</script>
