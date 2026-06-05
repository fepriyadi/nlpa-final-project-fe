<script setup lang="ts">
defineProps<{
  items: (string | null | undefined)[]
}>()
</script>

<template>
  <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
    <template v-for="(item, i) in items.filter(x => x != null && x !== '')" :key="i">
      <span v-if="i > 0" class="text-gray-300">·</span>
      <span>{{ item }}</span>
    </template>
  </p>
</template>
