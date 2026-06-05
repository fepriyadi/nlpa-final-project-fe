<script setup lang="ts">
defineProps<{
  label: string
  required?: boolean
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
      {{ label }}
      <span v-if="required" class="text-red-700 font-bold">*</span>
    </label>
    <slot />
  </div>
</template>
