<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import ComboboxViewport from './ComboboxViewport.vue'

const rootRef = ref<HTMLElement | null>(null)
const canScrollUp = ref(false)
const canScrollDown = ref(false)

let scrollTimer: number | null = null
let resizeObserver: ResizeObserver | null = null

const getViewportElement = () => {
  const root = rootRef.value
  if (!root) return null

  const element = root.querySelector('[data-slot="combobox-viewport"]')
  return element instanceof HTMLElement ? element : null
}

const syncScrollState = async () => {
  await nextTick()

  const viewport = getViewportElement()
  if (!viewport) {
    canScrollUp.value = false
    canScrollDown.value = false
    return
  }

  canScrollUp.value = viewport.scrollTop > 0
  canScrollDown.value = viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1
}

const scrollByStep = (direction: -1 | 1) => {
  const viewport = getViewportElement()
  if (!viewport) return

  viewport.scrollBy({ top: direction * 40 })
  void syncScrollState()
}

const stopScroll = () => {
  if (scrollTimer !== null) {
    window.clearInterval(scrollTimer)
    scrollTimer = null
  }
}

const startScroll = (direction: -1 | 1) => {
  stopScroll()
  scrollByStep(direction)
  scrollTimer = window.setInterval(() => scrollByStep(direction), 60)
}

const handlePointerUp = () => {
  stopScroll()
}

onMounted(() => {
  window.addEventListener('pointerup', handlePointerUp)
  resizeObserver = new ResizeObserver(() => {
    void syncScrollState()
  })

  const viewport = getViewportElement()
  if (viewport) resizeObserver.observe(viewport)

  void syncScrollState()
})

onUpdated(() => {
  const viewport = getViewportElement()
  if (viewport && resizeObserver) resizeObserver.observe(viewport)
  void syncScrollState()
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', handlePointerUp)
  resizeObserver?.disconnect()
  stopScroll()
})
</script>

<template>
  <div ref="rootRef" class="w-full">
    <button
      v-if="canScrollUp"
      type="button"
      class="flex w-full cursor-default items-center justify-center border-y bg-muted/30 py-1 text-muted-foreground"
      @pointerdown.prevent="startScroll(-1)"
      @pointerleave="stopScroll"
    >
      <ChevronUp class="size-4" />
    </button>

    <ComboboxViewport
      class="max-h-80"
      @scroll="syncScrollState"
    >
      <slot />
    </ComboboxViewport>

    <button
      v-if="canScrollDown"
      type="button"
      class="flex w-full cursor-default items-center justify-center border-t bg-muted/30 py-1 text-muted-foreground"
      @pointerdown.prevent="startScroll(1)"
      @pointerleave="stopScroll"
    >
      <ChevronDown class="size-4" />
    </button>
  </div>
</template>