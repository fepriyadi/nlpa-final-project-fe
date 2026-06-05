<script setup lang="ts">
import BaseLoader from '@/components/BaseLoader.vue'

withDefaults(defineProps<{
  text?: string
  padding?: string
}>(), {
  text: 'Memuat...',
  padding: 'py-16',
})
</script>

<template>
  <div :class="padding">
    <BaseLoader
      color="text-blue-500"
      :text="text"
      text-color="text-gray-400"
      wrapper-class="flex-col gap-2"
    />
  </div>
</template>
