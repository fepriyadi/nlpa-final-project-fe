<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<template>
  <div
    class="px-6 lg:px-8 bg-white border-b border-gray-100 overflow-hidden transition-[max-height,padding] duration-200 ease-out"
    :class="visible ? 'max-h-40 py-3' : 'max-h-0 py-0 border-b-0'"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <slot />
    </div>
  </div>
</template>
