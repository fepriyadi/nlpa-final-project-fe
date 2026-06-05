<script setup lang="ts">
import { Input } from '../ui/input'
import { useAttrs } from 'vue'
import { useField } from 'vee-validate'

defineOptions({
  inheritAttrs: false
})

defineProps<{
  modelValue?: string | number
}>()

const attrs = useAttrs()
const { value, errorMessage } = useField<string>(() => attrs.name as string, undefined, {
	syncVModel: true,
})
</script>

<template>
  <div>
    <div class="relative">
      <Input
        :id="attrs.id ?? attrs.name"
        v-model="value"
        v-bind="attrs"
        :class="{'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20': errorMessage}"
      />
      <slot></slot>
    </div>

    <span class="text-destructive text-xs">{{ errorMessage }}</span>
  </div>
</template>