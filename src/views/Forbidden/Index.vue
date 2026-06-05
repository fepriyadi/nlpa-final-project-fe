<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 class="text-6xl font-bold text-gray-300">403</h1>
    <p class="text-gray-500">You don't have permission to view this page.</p>
    <button
      class="text-sm text-indigo-600 hover:underline"
      @click="router.replace('/home')"
    >
      Back to home
    </button>
  </div>
</template>
