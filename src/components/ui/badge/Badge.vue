<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  variant?: 'blue' | 'gray' | 'slate' | 'amber' | 'green' | 'red'
  rounded?: 'full' | 'md'
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center px-2 py-0.5 text-[11px] font-medium',
      (!rounded || rounded === 'full') ? 'rounded-full' : 'rounded',
      variant === 'blue' && 'bg-blue-50 text-blue-700',
      variant === 'gray' && 'bg-gray-100 text-gray-700',
      variant === 'slate' && 'bg-slate-100 text-slate-700',
      variant === 'amber' && 'bg-amber-50 text-amber-700 border border-amber-200',
      variant === 'green' && 'bg-green-100 text-green-700',
      variant === 'red' && 'bg-red-100 text-red-700',
      props.class,
    )"
  >
    <slot />
  </span>
</template>
