<script setup lang="ts">
import { DatePicker } from '@/components/ui/date-picker'

const props = defineProps<{
  from: unknown
  to: unknown
  fromLabel?: string
  toLabel?: string
}>()

const emit = defineEmits<{
  'update:from': [value: unknown]
  'update:to': [value: unknown]
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2">
      <label class="text-xs text-gray-500 whitespace-nowrap">{{ props.fromLabel ?? 'Dari' }}</label>
      <DatePicker
        :model-value="props.from"
        :placeholder="props.fromLabel ?? 'Dari tanggal'"
        locale="id"
        class="w-44"
        @update:model-value="emit('update:from', $event)"
      />
    </div>
    <div class="flex items-center gap-2">
      <label class="text-xs text-gray-500 whitespace-nowrap">{{ props.toLabel ?? 'Sampai' }}</label>
      <DatePicker
        :model-value="props.to"
        :placeholder="props.toLabel ?? 'Sampai tanggal'"
        locale="id"
        class="w-44"
        @update:model-value="emit('update:to', $event)"
      />
    </div>
  </div>
</template>
