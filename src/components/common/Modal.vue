<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  zIndex?: string
  scrollable?: boolean
  closeOnBackdrop?: boolean
}>(), {
  size: 'md',
  zIndex: 'z-50',
  closeOnBackdrop: true,
})

const emit = defineEmits<{ close: [] }>()

function onBackdropClick() {
  if (props.closeOnBackdrop) emit('close')
}

const sizeClass: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-7xl',
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
      :class="props.zIndex"
      @click.self="onBackdropClick"
    >
      <div
        class="bg-white rounded-xl shadow-xl w-full"
        :class="[sizeClass[props.size], props.scrollable && 'flex flex-col max-h-[85vh]']"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
