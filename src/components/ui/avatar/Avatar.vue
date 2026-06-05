<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  initials: string
  color?: 'blue' | 'red' | 'amber'
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn(
      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
      (!props.color || props.color === 'blue') && 'bg-blue-100 text-blue-600',
      props.color === 'red' && 'bg-red-100 text-red-600',
      props.color === 'amber' && 'bg-amber-100 text-amber-600',
      props.class,
    )"
  >
    {{ initials }}
  </div>
</template>
