<template>
  <footer class="w-full bg-bg1 text-text2 mt-4 py-6 border-t border-border1/20">
    <div class="container mx-auto px-4 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
      <!-- Venstre side -->
      <p class="text-sm opacity-80">
        &copy; 2025 <strong>Beer Exchange</strong>  — Alle rettigheter konsumert 🍻
      </p>

      <!-- Høyre side -->
      <div class="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
        <a
          href="https://github.com/jensmjahle/Beer-Exchange/issues"
          class="hover:text-primary transition"
        >
          🐞 Rapporter en bug
        </a>
        <a
          href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1"
          class="hover:text-primary transition"
        >
          🎁 Gratis rabattkode
        </a>
        <a
          href="legg-inn-link-til-tindern-din-her-torbjørn"
          class="hover:text-primary transition"
        >
          📬 Kontakt oss
        </a>
        <button @click="handlePrivacyClick" class="hover:text-primary transition">
          🔒 Personvern
        </button>
      </div>
    </div>
  </footer>
</template>
<script setup>
import { useConfirmDialog } from "@/composables/useConfirmDialog.js";

const { showConfirm } = useConfirmDialog();

async function handlePrivacyClick() {
  const accepted = await showConfirm({
    title: "Personvernerklæring",
    message:
      "Beer Exchange brygger kun data relatert til øl, priser og handel. Vi bruker kun cookies som passer best til IPA 🍺. Godtar du dette?",
    confirmText: "Greit 🍪",
    cancelText: "Nei takk",
  });

  if (accepted) {
    console.log("Bruker godtok personvernerklæringen 🍻");
  } else {
    console.log("Bruker avslo personvernerklæringen 🙈");
  }
}
</script>