<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import { Button } from '@/components/ui/button'

withDefaults(defineProps<{
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
  zIndex?: string
}>(), {
  title: 'Konfirmasi',
  confirmLabel: 'Ya',
  cancelLabel: 'Batal',
  variant: 'default',
  loading: false,
  zIndex: 'z-[60]',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Modal
    :open="open"
    size="sm"
    :z-index="zIndex"
    :close-on-backdrop="!loading"
    @close="emit('cancel')"
  >
    <div class="px-5 py-4">
      <h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
      <div class="mt-2 text-sm text-gray-600">
        <slot>{{ message }}</slot>
      </div>
    </div>
    <div class="px-5 py-3 border-t bg-gray-50/60 flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        class="h-9"
        :disabled="loading"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </Button>
      <Button
        type="button"
        :variant="variant"
        class="h-9"
        :disabled="loading"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </Button>
    </div>
  </Modal>
</template>
