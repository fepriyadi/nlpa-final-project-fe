<script setup lang="ts">
import type { SelectItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Check } from 'lucide-vue-next'
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  injectSelectRootContext,
  useForwardProps,
} from 'reka-ui'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

const rootContext = injectSelectRootContext()
const isMultiple = computed(() => !!rootContext?.multiple?.value)
const isChecked = computed(() => {
  const modelValue = rootContext?.modelValue?.value
  if (isMultiple.value && Array.isArray(modelValue)) {
    return modelValue.includes(props.value)
  }
  return modelValue === props.value
})
</script>

<template>
  <SelectItem
    data-slot="select-item"
    v-bind="forwardedProps"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground [&_svg:not([class*=\'text-\'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        isMultiple ? 'pl-2 pr-2' : 'pl-2 pr-8',
        props.class,
      )
    "
  >
    <!-- ✅ Multiple mode: checkbox in front -->
    <Checkbox
      v-if="isMultiple"
      :model-value="isChecked"
      tabindex="-1"
      class="pointer-events-none"
    />

    <!-- ✅ Single mode: check indicator on the right -->
    <span
      v-else
      class="absolute right-2 flex size-3.5 items-center justify-center"
    >
      <SelectItemIndicator>
        <slot name="indicator-icon">
          <Check class="size-4" />
        </slot>
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
