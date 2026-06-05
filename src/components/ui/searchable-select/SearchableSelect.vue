<script setup lang="ts" generic="T extends { value: string; label: string }">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronDown, Check, Plus } from 'lucide-vue-next'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  modelValue: string | null
  options: T[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  loading?: boolean
  triggerClass?: string
  /** Extra classes for the popover content — use to raise z-index when nested inside a higher-stacked dialog/panel. */
  contentClass?: string
  /** When set, shows a "+ Tambah {createLabel}" footer that emits @create with the typed name. */
  createLabel?: string
  /** Disables the inline-create footer (e.g. while a previous create is in flight). */
  creating?: boolean
  /** When true, disables local filtering — parent supplies already-filtered options via @search. */
  serverSide?: boolean
  /** Debounce (ms) for emitting @search. Default 300ms when serverSide is true, ignored otherwise. */
  searchDebounceMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pilih...',
  searchPlaceholder: 'Cari...',
  emptyText: 'Tidak ada hasil',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  create: [name: string]
  search: [query: string]
}>()

const open = ref(false)
const search = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(open, (isOpen) => {
  if (!isOpen) {
    // Cancel any pending debounced emit — closing the popover (e.g. after
    // selecting an option) must not trigger another search round-trip.
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
    search.value = ''
  }
})

watch(search, (q) => {
  if (!props.serverSide) return
  // Only emit while the popover is open — the on-close reset above sets
  // search to '' and we don't want that to fire a refetch.
  if (!open.value) return
  if (searchTimer) clearTimeout(searchTimer)
  const delay = props.searchDebounceMs ?? 300
  searchTimer = setTimeout(() => emit('search', q.trim()), delay)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

const selected = computed(() =>
  props.options.find(option => option.value === props.modelValue) ?? null,
)

const filtered = computed(() => {
  if (props.serverSide) return props.options
  const q = search.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(option => option.label.toLowerCase().includes(q))
})

const trimmedSearch = computed(() => search.value.trim())

const canCreate = computed(() => {
  if (!props.createLabel) return false
  const q = trimmedSearch.value
  if (!q) return false
  return !props.options.some(option => option.label.toLowerCase() === q.toLowerCase())
})

function selectOption(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

function triggerCreate() {
  if (!canCreate.value || props.creating) return
  emit('create', trimmedSearch.value)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger
      as="button"
      type="button"
      :disabled="disabled || loading"
      :title="selected?.label ?? ''"
      :class="cn(
        'border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        !selected && 'text-muted-foreground',
        triggerClass,
      )"
    >
      <span class="truncate text-left">
        {{ loading ? 'Memuat...' : (selected?.label ?? placeholder) }}
      </span>
      <ChevronDown class="size-4 shrink-0 opacity-50" />
    </PopoverTrigger>
    <PopoverContent
      :class="cn('w-(--reka-popover-trigger-width) p-0', contentClass)"
      align="start"
    >
      <div class="border-b p-2">
        <Input
          v-model="search"
          :placeholder="searchPlaceholder"
          class="h-8"
          autofocus
        />
      </div>
      <div class="max-h-60 overflow-y-auto py-1">
        <div
          v-if="filtered.length === 0 && !canCreate"
          class="px-3 py-6 text-center text-xs text-muted-foreground"
        >
          {{ emptyText }}
        </div>
        <button
          v-for="option in filtered"
          :key="option.value"
          type="button"
          :title="option.label"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          @click="selectOption(option.value)"
        >
          <span class="flex-1 truncate">{{ option.label }}</span>
          <Check
            v-if="option.value === modelValue"
            class="size-4 text-primary shrink-0"
          />
        </button>
      </div>
      <div v-if="canCreate" class="border-t p-1">
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm rounded-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
          :disabled="creating"
          @click="triggerCreate"
        >
          <Plus class="size-4 text-primary shrink-0" />
          <span class="flex-1 truncate">
            {{ creating ? 'Menambahkan...' : `Tambah ${createLabel} "${trimmedSearch}"` }}
          </span>
        </button>
      </div>
    </PopoverContent>
  </Popover>
</template>
