<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { getLocalTimeZone } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { useDateFormatter } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const model = defineModel<any>()

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    placeholder?: string
    locale?: string
    disabled?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    minValue?: any
  }>(),
  {
    placeholder: 'Pick a date',
    locale: 'en',
    disabled: false,
    minValue: undefined,
  },
)

const formatter = useDateFormatter(props.locale)

const displayValue = computed(() => {
  if (!model.value) return null
  return formatter.custom(model.value.toDate(getLocalTimeZone()), {
    dateStyle: 'long',
  })
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="disabled"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !model && 'text-muted-foreground',
            props.class,
          )
        "
      >
        <CalendarIcon class="mr-2 size-4 shrink-0" />
        <span>{{ displayValue ?? placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="model"
        :min-value="minValue"
        initial-focus
        @update:model-value="(v) => (model = v)"
      />
    </PopoverContent>
  </Popover>
</template>
