<script setup lang="ts">
defineProps<{ count: number }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    v-if="count > 0"
    type="button"
    class="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
    @click="$emit('click')"
  >
    Reset
    <span class="text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
      {{ count }}
    </span>
  </button>
</template>
