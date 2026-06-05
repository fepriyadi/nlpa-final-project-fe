<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  bordered?: boolean
  padding?: string
}>(), {
  padding: 'py-16',
  bordered: false,
})
</script>

<template>
  <div
    :class="[
      padding,
      'text-center',
      bordered && 'bg-white border border-dashed border-gray-200 rounded-xl',
    ]"
  >
    <p class="font-medium text-gray-500">{{ title }}</p>
    <p v-if="description" class="text-sm mt-1 text-gray-400">{{ description }}</p>
    <slot />
  </div>
</template>
