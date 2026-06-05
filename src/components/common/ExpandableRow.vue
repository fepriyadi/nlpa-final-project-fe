<script setup lang="ts">
defineProps<{
  expanded: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <div
    class="flex items-start justify-between gap-4 px-5 py-4 bg-gray-50 rounded-t-xl cursor-pointer select-none hover:bg-gray-100/80 transition-colors"
    :class="expanded ? 'border-b' : 'rounded-b-xl'"
    @click="$emit('toggle')"
  >
    <div class="flex items-center gap-3 min-w-0">
      <svg
        class="w-4 h-4 text-gray-400 shrink-0 transition-transform"
        :class="expanded ? 'rotate-90' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
      </svg>
      <slot />
    </div>
    <div class="flex items-center gap-3 shrink-0" @click.stop>
      <slot name="actions" />
    </div>
  </div>
</template>
