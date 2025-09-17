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
import {disconnectGlobalSocket, initGlobalSocket} from '@/services/websocket/globalSocket.js';
import {useI18n} from "vue-i18n";
import Footer from "@/components/Footer.vue";
const { t } = useI18n()

const router = useRouter();

onMounted(() => {
  const token = sessionStorage.getItem('jwt');
  if (!token) return;

  initGlobalSocket(
      token,

      (error) => {
        console.warn('Received WebSocket error for admin:', error);
        if (error.type === 'UNAUTHORIZED') {
          sessionStorage.removeItem('jwt');
          router.push({ name: 'admin-login' });
        }
      },

      (broadcast) => {
        console.log('Admin broadcast:', broadcast);
      },

      (notif) => {
        console.log('Notification received:', notif);
      },
      t
  );
});


onUnmounted(() => {
  disconnectGlobalSocket();
});
</script>
