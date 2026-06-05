<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  size?: string | number // e.g. 'h-8 w-8' or 32
  color?: string // e.g. 'text-white'
  text?: string
  textColor?: string // e.g. 'text-white'
  wrapperClass?: string
}>()

const numericSize = computed(() => {
  if (typeof props.size === 'number' || (typeof props.size === 'string' && /^\d+$/.test(props.size))) {
    return props.size
  }
  return 32 // default size
})

const colorClass = computed(() => props.color || 'text-white')
const textColorClass = computed(() => props.textColor || props.color || 'text-white')
</script>

<template>
  <div class="flex justify-center items-center" :class="wrapperClass">
    <svg
      :class="['animate-spin', typeof size === 'string' ? size : '', colorClass]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      :width="numericSize"
      :height="numericSize"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
    <span v-if="text" class="ml-3 font-medium" :class="textColorClass">{{ text }}</span>
  </div>
</template>