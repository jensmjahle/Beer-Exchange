<!-- AdminLoginView.vue -->
<template>
  <div class="h-full w-full flex flex-col items-center justify-center">
    <AdminLoginForm :onLogin="loginUser" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AdminLoginForm from "@/components/AdminLoginForm.vue";
import { loginAdmin } from "@/services/authService";

const router = useRouter();

const loginUser = async (username: string, password: string) => {
  try {
    const response = await loginAdmin(username, password);
    const token = response.token;
    if (token) {
      sessionStorage.setItem("jwt", token);
      await router.push({ name: "admin-home" });
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};
</script>
