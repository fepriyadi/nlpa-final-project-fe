<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 class="text-6xl font-bold text-gray-300">404</h1>
    <p class="text-gray-500">Page not found.</p>
    <button
      class="text-sm text-indigo-600 hover:underline"
      @click="router.back()"
    >
      Go back
    </button>
  </div>
</template>
