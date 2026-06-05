<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { type DateValue } from '@internationalized/date'
import Papa from 'papaparse'
import { toast } from 'vue-sonner'
import {
  ChevronLeft,
  Download,
  Eye,
  FileText,
  ListFilter,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import {
  type Batch,
  type ClassifiedReview,
  type Review,
  type ReviewLabel,
  type SentimentAnalysis,
  LABEL_META,
  avatarClass,
  avatarInitials,
  classifyReview,
  pctID,
  suggestionFor,
} from '@/lib/fake-review/classifier'
import { type AnalyzeResult, analyzeBulk, analyzeOne, getModels } from '@/services/analysis'
import { usePagination } from '@/lib/use-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

const datasetChoice = ref('')
const modelChoice = ref('')
const categoryChoice = ref('')

// Models come from the API (GET /models); the dropdowns are populated on mount.
const allowedModels = ref<string[]>([])

onMounted(async () => {
  try {
    const res = await getModels()
    allowedModels.value = res.allowed_models
    modelChoice.value = res.default_model || res.allowed_models[0] || ''
  } catch {
    toast.error('Gagal memuat daftar model dari API')
  }
})

// Adapt the API's snake_case result to the camelCase shape stored on a Review.
function toAnalysis(r: AnalyzeResult): SentimentAnalysis {
  return {
    predictedSentiment: r.predicted_sentiment,
    ratingSentiment: r.rating_sentiment,
    isConsistent: r.is_consistent,
    explanation: r.explanation,
  }
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

type FilterValue = 'all' | ReviewLabel

const FILTERS: { value: FilterValue, label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'genuine', label: 'Genuine' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'fake', label: 'Fake' },
]

/* ----------------- State ----------------- */
const reviews = ref<Review[]>([])
const batches = ref<Batch[]>([])
const selectedBatchId = ref<string | undefined>(undefined)
const currentFilter = ref<FilterValue>('all')
const searchQ = ref('')
let nextId = 1
let nextBatchSeq = 1

const selectedBatch = computed(() => batches.value.find(b => b.id === selectedBatchId.value))

/**
 * Create a batch from freshly added reviews, stamp it with real metadata
 * (timestamps, current user, marketplace/model/category), and select it.
 */
function createBatch(newReviews: Review[], source: string) {
  const now = new Date()
  const fakeCount = newReviews.filter(r => classifyReview(r).label !== 'genuine').length
  const id = `BATCH-2026-${String(nextBatchSeq++).padStart(4, '0')}`
  // Tag every review with this batch so the table can show one batch at a time.
  for (const r of newReviews) r.batchId = id
  batches.value.unshift({
    id,
    marketplace: datasetChoice.value.trim() || '—',
    category: categoryChoice.value.trim() || '—',
    count: newReviews.length,
    fakePct: newReviews.length ? pctID((fakeCount * 100) / newReviews.length) : '0%',
    date: dateFmt.format(now),
    source,
    model: modelChoice.value,
    selected: true,
  })
  selectedBatchId.value = id
}

/* ----------------- Derived data ----------------- */
const classified = computed<ClassifiedReview[]>(() =>
  reviews.value.map(r => ({ ...r, ...classifyReview(r) })),
)

// Reviews belonging to the currently selected batch — manual entries and CSV
// uploads each form their own batch, so the table never mixes them.
const batchReviews = computed(() =>
  classified.value.filter(r => r.batchId === selectedBatchId.value),
)

const filtered = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  return batchReviews.value.filter((r) => {
    if (currentFilter.value !== 'all' && r.label !== currentFilter.value) return false
    if (q) {
      return (
        r.username.toLowerCase().includes(q)
        || r.text.toLowerCase().includes(q)
        || r.product.toLowerCase().includes(q)
      )
    }
    return true
  })
})

/* ----------------- Pagination ----------------- */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const pageSize = ref(10)
const totalItems = computed(() => filtered.value.length)

const { currentPage, totalPages, pageStart, rangeText, pageNumbers, onPageChange } =
  usePagination(totalItems, pageSize, 'review')

const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

// Snap back to page 1 whenever the result set changes underneath us, and clamp
// if the current page no longer exists (e.g. after deleting the last row).
watch([currentFilter, searchQ, selectedBatchId, pageSize], () => {
  currentPage.value = 1
})
watch(totalPages, (max) => {
  if (currentPage.value > max) currentPage.value = max
})

const summary = computed(() => {
  const list = batchReviews.value
  const total = list.length
  const genuine = list.filter(r => r.label === 'genuine').length
  const fake = total - genuine
  // API-analyzed rows have no confidence (null); average only the scored ones.
  const scored = list.map(r => r.confidence).filter((c): c is number => c != null)
  const avgConf = scored.length ? scored.reduce((a, c) => a + c, 0) / scored.length : 0
  return {
    total,
    genuine,
    fake,
    genuinePct: total ? pctID((genuine * 100) / total) : '0%',
    fakePct: total ? pctID((fake * 100) / total) : '0%',
    avgConf: scored.length ? pctID(avgConf) : '—',
  }
})

/* ----------------- Drawer ----------------- */
const drawerId = ref<number | null>(null)
const drawerReview = computed(() =>
  drawerId.value == null ? null : classified.value.find(r => r.id === drawerId.value) ?? null,
)

function openDrawer(id: number) {
  drawerId.value = id
}
function closeDrawer() {
  drawerId.value = null
}

function markLabel(label: ReviewLabel) {
  toast.success(label === 'fake' ? 'Review ditandai sebagai Fake' : 'Review ditandai sebagai Genuine')
  closeDrawer()
}

/* ----------------- Add review modal ----------------- */
const modalOpen = ref(false)
const submitting = ref(false)
const form = ref({ username: '', rating: 0, text: '', product: '' })
// Date is held as a DateValue for the DatePicker component (not a string).
const reviewDate = ref<DateValue>()
const ratingLabels = ['', 'Sangat buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat baik']

function focusUsername() {
  nextTick(() => document.getElementById('f-username')?.focus())
}

function openModal() {
  form.value = { username: '', rating: 0, text: '', product: '' }
  reviewDate.value = undefined
  datasetChoice.value = ''
  categoryChoice.value = ''
  modalOpen.value = true
  focusUsername()
}
function closeModal() {
  modalOpen.value = false
}

async function submitAdd() {
  const username = form.value.username.trim()
  const text = form.value.text.trim()
  if (!username) return toast.error('Username wajib diisi')
  if (!form.value.rating) return toast.error('Pilih rating')
  if (text.length < 5) return toast.error('Isi review terlalu pendek')
  if (!datasetChoice.value.trim()) return toast.error('Marketplace wajib diisi')
  if (!categoryChoice.value.trim()) return toast.error('Kategori wajib diisi')

  const rating = form.value.rating
  submitting.value = true
  try {
    const result = await analyzeOne({
      // eslint-disable-next-line camelcase
      review_text: text,
      rating,
      model: modelChoice.value || undefined,
    })
    const review: Review = {
      id: nextId++,
      username,
      rating,
      text,
      product: form.value.product.trim() || '—',
      date: reviewDate.value?.toString() || new Date().toISOString().slice(0, 10),
      analysis: toAnalysis(result),
    }
    reviews.value.unshift(review)
    createBatch([review], 'Input manual')
    closeModal()
    toast.success('Review ditambahkan & dianalisis')
  } catch {
    toast.error('Gagal menganalisis review. Coba lagi.')
  } finally {
    submitting.value = false
  }
}

/* ----------------- CSV: template + upload ----------------- */
const fileRef = useTemplateRef<HTMLInputElement>('fileInput')
const uploadOpen = ref(false)
const processing = ref(false)
const selectedFile = ref<File | null>(null)

function openUpload() {
  selectedFile.value = null
  datasetChoice.value = ''
  categoryChoice.value = ''
  uploadOpen.value = true
}
function closeUpload() {
  uploadOpen.value = false
  selectedFile.value = null
  if (fileRef.value) fileRef.value.value = ''
}

function downloadTemplate() {
  const csv = [
    'username,rating,review_text,product,date',
    'budi_ganteng21,5,"Pengiriman cepat dan produk sesuai gambar, sudah pakai 2 minggu hasilnya bagus","Serum X 30ml",2026-06-01',
    'user_anonim,5,"Mantap! Recommended! Barang ori!!","Serum X 30ml",2026-06-02',
    'sari.r,3,"Lumayan, tapi agak lengket di kulit. Mungkin cocok untuk kulit kering","Moisturizer Y",2026-06-02',
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'template_review.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
  toast.success('Template CSV diunduh')
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function processCsv() {
  const file = selectedFile.value
  if (!file) return toast.error('Pilih file CSV terlebih dahulu')
  if (!datasetChoice.value.trim()) return toast.error('Marketplace wajib diisi')
  if (!categoryChoice.value.trim()) return toast.error('Kategori wajib diisi')

  Papa.parse<Record<string, string>>(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim().toLowerCase(),
    complete: async (result) => {
      const rows = result.data
      const first = rows[0] ?? {}
      if (!('username' in first) || !('rating' in first) || !('review_text' in first)) {
        toast.error('Header wajib: username, rating, review_text')
        return
      }
      const imported: Review[] = []
      for (const row of rows) {
        const username = (row.username || '').trim()
        const rating = Number.parseInt(row.rating || '', 10)
        const text = (row.review_text || '').trim()
        if (!username || !text || !rating) continue
        imported.push({
          id: nextId++,
          username,
          rating,
          text,
          product: (row.product || '').trim() || '—',
          date: (row.date || '').trim(),
        })
      }
      if (!imported.length) {
        toast.error('Tidak ada baris valid pada CSV')
        return
      }

      // Send only the validated rows (rebuilt as a review_text/rating CSV) so the
      // API's results array lines up 1:1 with `imported` by index.
      processing.value = true
      try {
        const res = await analyzeBulk(buildReviewCsv(imported), modelChoice.value || undefined)
        imported.forEach((review, i) => {
          const r = res.results[i]
          if (r) review.analysis = toAnalysis(r)
        })
        reviews.value.unshift(...imported)
        createBatch(imported, 'Upload CSV')
        toast.success(`${imported.length} review ditambahkan & dianalisis dari CSV`)
        closeUpload()
      } catch {
        toast.error('Gagal menganalisis CSV. Coba lagi.')
      } finally {
        processing.value = false
      }
    },
    error: () => {
      toast.error('Gagal membaca file CSV')
    },
  })
}

/** Build a minimal `review_text,rating` CSV File from validated rows for /analyze-bulk. */
function buildReviewCsv(rows: Review[]): File {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const body = rows.map(r => `${esc(r.text)},${r.rating}`).join('\n')
  const csv = `review_text,rating\n${body}\n`
  return new File([csv], 'reviews.csv', { type: 'text/csv' })
}

/* ----------------- Auto-hide header on scroll ----------------- */
// Hide the top toolbar when scrolling down inside the main panel, reveal it
// again when scrolling back up. The page scrolls inside <main>, not on window.
const mainRef = useTemplateRef<HTMLElement>('mainScroll')
const headerHidden = ref(false)
let lastScrollTop = 0

useEventListener(mainRef, 'scroll', () => {
  const el = mainRef.value
  if (!el) return
  const top = el.scrollTop
  // Ignore jitter so the header doesn't flicker on tiny scrolls.
  if (Math.abs(top - lastScrollTop) < 6) return

  // At the bottom, collapsing the header grows the scroll area and clamps
  // scrollTop, which the browser reports as an upward scroll. Reacting to it
  // would reopen the header and oscillate, so keep it hidden here instead.
  if (el.scrollHeight - el.clientHeight - top < 8) {
    headerHidden.value = true
    lastScrollTop = top
    return
  }

  headerHidden.value = top > lastScrollTop && top > 40
  lastScrollTop = top
})

/* ----------------- Keyboard: Escape closes overlays ----------------- */
useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  if (modalOpen.value) closeModal()
  else if (uploadOpen.value) closeUpload()
  else if (drawerId.value != null) closeDrawer()
})

/* ----------------- Misc ----------------- */
const charCount = computed(() => form.value.text.length)
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

document.title = 'Fake Review Detector'

// Focus the first field whenever the modal opens via any path.
watch(modalOpen, (open) => {
  if (open) focusUsername()
})
</script>

<template>
  <div lang="id" class="flex flex-col h-screen bg-[#f6f7f9] text-slate-900">
    <!-- Toolbar -->
    <header
      class="bg-white border-b border-gray-200 px-4 flex flex-wrap items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out"
      :class="headerHidden ? 'max-h-0 py-0 opacity-0 border-b-0 pointer-events-none' : 'max-h-40 py-2.5 opacity-100'"
    >
      <!-- Product title -->
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[13px] tracking-tight" aria-hidden="true">
          FR
        </div>
        <div class="leading-tight">
          <h1 class="text-[13.5px] font-bold text-slate-900">Fake Review Detector</h1>
          <p class="text-[10.5px] text-slate-500 -mt-0.5">NLP A Final Project Classifier</p>
        </div>
      </div>

      <div class="flex-1" />

      <!-- Search -->
      <div class="relative w-full max-w-xs">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" aria-hidden="true" />
        <Label for="review-search" class="sr-only">Cari review</Label>
        <Input
          id="review-search"
          v-model="searchQ"
          type="search"
          placeholder="Cari username, isi review, kata kunci..."
          class="pl-8 text-sm"
        />
      </div>

      <!-- Operation buttons -->
      <Button
        type="button"
        variant="outline"
        class="h-9 px-3 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
        @click="openUpload"
      >
        <Upload class="size-3.5" aria-hidden="true" />
        Upload CSV
      </Button>
      <Button
        type="button"
        class="h-9 px-3 gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
        @click="openModal"
      >
        <Plus class="size-3.5" aria-hidden="true" />
        Tambah Review
      </Button>
    </header>

    <!-- Body -->
    <div class="flex-1 flex min-h-0">
      <!-- Sidebar: batch list -->
      <aside class="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0" aria-label="Daftar batch deteksi">
        <div class="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Batch Deteksi</span>
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] text-slate-400 tabular-nums">{{ batches.length }}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              class="size-6 rounded text-slate-400 hover:bg-slate-100"
              aria-label="Ciutkan panel batch"
            >
              <ChevronLeft class="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <ul class="flex-1 overflow-auto scroll-thin p-2 space-y-1">
          <li v-if="!batches.length" class="px-3 py-6 text-center text-[11.5px] text-slate-400 leading-relaxed">
            Belum ada batch. Tambah review atau upload CSV untuk memulai.
          </li>
          <li v-for="b in batches" :key="b.id">
            <button
              type="button"
              :aria-current="b.id === selectedBatchId ? 'true' : undefined"
              class="w-full text-left rounded-lg border px-3 py-2.5 block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              :class="b.id === selectedBatchId
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/10'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50'"
              @click="selectedBatchId = b.id"
            >
              <span class="flex items-center justify-between gap-2 mb-0.5">
                <span
                  class="text-[11.5px] font-bold truncate"
                  :class="b.id === selectedBatchId ? 'text-blue-600' : 'text-slate-900'"
                >{{ b.id }}</span>
                <span class="text-[10.5px] text-slate-400 tabular-nums">{{ b.count }} review</span>
              </span>
              <span class="block text-[12px] text-slate-700 truncate">{{ b.marketplace }} — {{ b.category }}</span>
              <span class="block text-[11px] text-slate-500 truncate">{{ b.fakePct }} fake · {{ b.date }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Main panel -->
      <main ref="mainScroll" class="flex-1 overflow-auto scroll-thin p-5 bg-[#f6f7f9] min-w-0">
        <!-- Selected batch header -->
        <section v-if="selectedBatch" class="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-[15px] font-bold text-slate-900 tracking-tight">{{ selectedBatch?.id }}</h2>
              <span class="text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Selesai</span>
            </div>
            <p class="text-slate-500 text-[12.5px]">
              {{ selectedBatch?.marketplace }} — Kategori {{ selectedBatch?.category }} · sumber: {{ selectedBatch?.source }} · model: {{ selectedBatch?.model }}
            </p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                class="border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Export hasil batch"
                @click="toast.message('Fitur export belum tersedia di prototipe')"
              >
                <Download class="size-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                class="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                aria-label="Hapus batch"
                @click="toast.message('Fitur hapus batch belum tersedia di prototipe')"
              >
                <Trash2 class="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>

        <!-- Empty state: no batch yet (seed data removed) -->
        <section v-else class="bg-white border border-dashed border-gray-300 rounded-xl px-5 py-10 mb-4 text-center">
          <h2 class="text-[15px] font-bold text-slate-900 tracking-tight mb-1">Belum ada batch deteksi</h2>
          <p class="text-[12.5px] text-slate-500 mb-4">
            Tambah review manual atau upload CSV untuk mulai menganalisis dengan model.
          </p>
          <div class="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              class="h-9 px-3 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
              @click="openUpload"
            >
              <Upload class="size-3.5" aria-hidden="true" />
              Upload CSV
            </Button>
            <Button
              type="button"
              class="h-9 px-3 gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
              @click="openModal"
            >
              <Plus class="size-3.5" aria-hidden="true" />
              Tambah Review
            </Button>
          </div>
        </section>

        <!-- Summary grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div class="bg-white border border-gray-200 rounded-[10px] px-4 py-3.5 flex flex-col gap-1">
            <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Total Review</div>
            <div class="text-[22px] font-bold text-slate-900 tabular-nums leading-tight">{{ summary.total }}</div>
            <div class="text-[11.5px] text-slate-500">probabilistik per review</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-[10px] px-4 py-3.5 flex flex-col gap-1">
            <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Genuine</div>
            <div class="text-[22px] font-bold text-emerald-700 tabular-nums leading-tight">{{ summary.genuine }}</div>
            <div class="text-[11.5px] text-slate-500">{{ summary.genuinePct }} dari total</div>
          </div>
          <div class="border border-blue-600 rounded-[10px] px-4 py-3.5 flex flex-col gap-1 bg-gradient-to-b from-blue-50 to-white">
            <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Fake / Suspicious</div>
            <div class="text-[22px] font-bold tabular-nums leading-tight text-rose-700">{{ summary.fake }}</div>
            <div class="text-[11.5px] text-slate-500">{{ summary.fakePct }} · perlu review manual</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-[10px] px-4 py-3.5 flex flex-col gap-1">
            <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Confidence</div>
            <div class="text-[22px] font-bold text-slate-900 tabular-nums leading-tight">{{ summary.avgConf }}</div>
            <div class="text-[11.5px] text-slate-500">probabilitas model</div>
          </div>
        </div>

        <!-- Filter chips -->
        <div class="bg-white border border-gray-200 rounded-xl px-3 py-2 mb-3 flex flex-wrap items-center gap-2">
          <span id="filter-label" class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">Filter</span>
          <div class="flex flex-wrap items-center gap-1" role="group" aria-labelledby="filter-label">
            <Button
              v-for="f in FILTERS"
              :key="f.value"
              type="button"
              variant="ghost"
              :aria-pressed="currentFilter === f.value"
              :class="[
                'h-7 px-2.5 text-[12px] font-normal',
                currentFilter === f.value ? 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white' : 'text-slate-600 hover:bg-slate-100',
              ]"
              @click="currentFilter = f.value"
            >
              {{ f.label }}
            </Button>
          </div>
          <div class="flex-1" />
          <span class="text-[11.5px] text-slate-500" aria-live="polite">
            {{ filtered.length }} dari {{ summary.total }} review
          </span>
        </div>

        <!-- Results table -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <table class="w-full border-collapse min-w-[1100px]">
            <caption class="sr-only">Hasil deteksi review untuk batch {{ selectedBatch?.id }}</caption>
            <thead>
              <tr class="bg-slate-50 border-b border-gray-200">
                <th scope="col" class="text-left px-3.5 py-2.5 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                <th scope="col" class="text-left px-3.5 py-2.5 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Username</th>
                <th scope="col" class="text-left px-3.5 py-2.5 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider w-28">Rating</th>
                <th scope="col" class="text-left px-3.5 py-2.5 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">Isi Review</th>
                <th scope="col" class="text-left px-3.5 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-600">Prediksi</th>
                <th scope="col" class="text-right px-3.5 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-600">Confidence</th>
                <th scope="col" class="text-left px-3.5 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700">Saran Tindakan</th>
                <th scope="col" class="text-right px-3.5 py-2.5 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider w-20">
                  <span class="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, idx) in paginated"
                :key="r.id"
                class="border-b border-slate-100 hover:bg-slate-50/70"
              >
                <td class="px-3.5 py-3 text-[11.5px] tabular-nums text-slate-400">{{ String(pageStart + idx).padStart(2, '0') }}</td>
                <td class="px-3.5 py-3">
                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="w-7 h-7 rounded-full text-[11px] font-bold inline-flex items-center justify-center shrink-0"
                      :class="avatarClass(r.username)"
                      aria-hidden="true"
                    >{{ avatarInitials(r.username) }}</span>
                    <div class="min-w-0">
                      <div class="text-[12.5px] font-medium text-slate-900 truncate">{{ r.username }}</div>
                      <div class="text-[10.5px] text-slate-400 truncate">{{ r.product }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-3.5 py-3">
                  <span class="inline-flex items-center gap-0.5" :aria-label="`Rating ${r.rating} dari 5`">
                    <Star
                      v-for="i in 5"
                      :key="i"
                      class="w-3 h-3"
                      :class="i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'"
                      aria-hidden="true"
                    />
                    <span class="ml-1 text-[11.5px] text-slate-500 tabular-nums">{{ r.rating }}.0</span>
                  </span>
                </td>
                <td class="px-3.5 py-3 max-w-md">
                  <div class="text-[12.5px] text-slate-700 line-clamp-2">{{ r.text }}</div>
                  <div class="text-[10.5px] text-slate-400 mt-0.5 tabular-nums">{{ r.date }}</div>
                </td>
                <td class="px-3.5 py-3">
                  <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded" :class="LABEL_META[r.label].badge">
                    <span class="w-1.5 h-1.5 rounded-full" :class="LABEL_META[r.label].dot" aria-hidden="true" />
                    {{ LABEL_META[r.label].text }}
                  </span>
                </td>
                <td class="px-3.5 py-3 text-right">
                  <div v-if="r.confidence != null" class="inline-flex flex-col items-end gap-1">
                    <span class="text-[12.5px] font-semibold tabular-nums text-slate-900">{{ pctID(r.confidence) }}</span>
                    <div class="w-20 h-1 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                      <div class="h-full" :class="LABEL_META[r.label].bar" :style="{ width: `${r.confidence}%` }" />
                    </div>
                  </div>
                  <span v-else class="text-[12.5px] text-slate-400" title="API tidak memberi skor confidence">—</span>
                </td>
                <td class="px-3.5 py-3 text-[12px] text-slate-600 max-w-xs">{{ suggestionFor(r.label, r.rating) }}</td>
                <td class="px-3.5 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      class="size-7 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      :aria-label="`Lihat detail review dari ${r.username}`"
                      @click="openDrawer(r.id)"
                    >
                      <Eye class="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      class="size-7 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      :aria-label="`Hapus review dari ${r.username}`"
                      @click="reviews = reviews.filter(x => x.id !== r.id); toast.success('Review dihapus')"
                    >
                      <Trash2 class="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!filtered.length" class="px-6 py-12 text-center text-[12.5px] text-slate-500">
            Tidak ada review yang cocok dengan filter / pencarian.
          </div>

          <!-- Pagination -->
          <div
            v-if="filtered.length"
            class="flex flex-col sm:flex-row items-center justify-between gap-3 px-3.5 py-3 border-t border-gray-200 bg-slate-50/60"
          >
            <div class="flex items-center gap-2 text-[11.5px] text-slate-500">
              <Label for="page-size" class="font-medium text-slate-600">Baris per halaman</Label>
              <Select v-model.number="pageSize">
                <SelectTrigger id="page-size" class="h-8 w-18 bg-white text-[12.5px]" aria-label="Baris per halaman">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="n in PAGE_SIZE_OPTIONS" :key="n" :value="n">{{ n }}</SelectItem>
                </SelectContent>
              </Select>
              <span class="tabular-nums" aria-live="polite">{{ rangeText }}</span>
            </div>

            <nav class="flex items-center gap-1" aria-label="Navigasi halaman">
              <button
                type="button"
                class="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                :disabled="currentPage <= 1"
                aria-label="Halaman pertama"
                @click="onPageChange(1)"
              >
                «
              </button>
              <button
                type="button"
                class="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                :disabled="currentPage <= 1"
                aria-label="Sebelumnya"
                @click="onPageChange(currentPage - 1)"
              >
                ‹
              </button>
              <button
                v-for="p in pageNumbers"
                :key="p"
                type="button"
                class="min-w-8 h-8 px-1.5 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors"
                :class="p === currentPage ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'"
                :aria-current="p === currentPage ? 'page' : undefined"
                @click="onPageChange(p)"
              >
                {{ p }}
              </button>
              <button
                type="button"
                class="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                :disabled="currentPage >= totalPages"
                aria-label="Berikutnya"
                @click="onPageChange(currentPage + 1)"
              >
                ›
              </button>
              <button
                type="button"
                class="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                :disabled="currentPage >= totalPages"
                aria-label="Halaman terakhir"
                @click="onPageChange(totalPages)"
              >
                »
              </button>
            </nav>
          </div>
        </div>

        <p class="mt-3 text-[11px] text-slate-400 leading-relaxed">
          Prediksi model bersifat probabilistik dan dapat mengandung false positive. Selalu lakukan
          verifikasi manual sebelum mengambil tindakan terhadap akun pengguna.
        </p>
      </main>
    </div>

    <!-- ====================== Upload CSV Modal ====================== -->
    <Teleport to="body">
      <div
        v-if="uploadOpen"
        class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        @click.self="closeUpload"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-title"
          class="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200"
        >
          <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 id="upload-title" class="text-[14px] font-bold text-slate-900">Upload Review dari CSV</h2>
              <p class="text-[11.5px] text-slate-500">Impor banyak review sekaligus untuk dianalisis modelnya</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              class="size-7 text-slate-400 hover:bg-slate-100"
              aria-label="Tutup dialog"
              @click="closeUpload"
            >
              <X class="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div class="px-5 py-4 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label for="u-marketplace" class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <ListFilter class="size-3.5 text-purple-500" aria-hidden="true" />
                  Marketplace <span class="text-rose-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="u-marketplace"
                  v-model="datasetChoice"
                  type="text"
                  placeholder="cth: Shopee, Tokopedia, Google Maps"
                  class="text-[13px]"
                />
              </div>
              <div>
                <Label for="u-model" class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Sparkles class="size-3.5 text-blue-500" aria-hidden="true" />
                  Model <span class="text-rose-500" aria-hidden="true">*</span>
                </Label>
                <Select v-model="modelChoice">
                  <SelectTrigger id="u-model" class="w-full bg-white text-[13px]" aria-label="Model klasifikasi">
                    <SelectValue placeholder="Pilih model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in allowedModels" :key="m" :value="m">{{ m }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label for="u-category" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Kategori <span class="text-rose-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="u-category"
                v-model="categoryChoice"
                type="text"
                placeholder="cth: Skincare, Elektronik, Restoran"
                class="text-[13px]"
              />
            </div>

            <!-- Native <label>+<input> so clicking opens the file dialog with no
                 JS .click() — avoids the picker being blocked on the first try. -->
            <label
              for="csv-file-input"
              class="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-5 py-8 text-center cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
              :class="selectedFile
                ? 'border-emerald-300 bg-emerald-50/50'
                : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'"
            >
              <input
                id="csv-file-input"
                ref="fileInput"
                type="file"
                accept=".csv,text/csv"
                class="sr-only"
                @change="onFileChange"
              >
              <span
                class="w-11 h-11 rounded-full flex items-center justify-center"
                :class="selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'"
                aria-hidden="true"
              >
                <FileText v-if="selectedFile" class="size-5" />
                <Upload v-else class="size-5" />
              </span>
              <template v-if="selectedFile">
                <span class="text-[13px] font-semibold text-slate-900 break-all">{{ selectedFile.name }}</span>
                <span class="text-[11.5px] text-slate-500">Klik untuk ganti file</span>
              </template>
              <template v-else>
                <span class="text-[13px] font-semibold text-slate-900">Pilih file CSV</span>
                <span class="text-[11.5px] text-slate-500">Header wajib: username, rating, review_text</span>
              </template>
            </label>

            <p class="text-[11.5px] text-slate-500 leading-relaxed">
              Belum punya format file?
              <button
                type="button"
                class="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                @click="downloadTemplate"
              >
                <Download class="size-3.5" aria-hidden="true" />
                Unduh template CSV
              </button>
            </p>
          </div>

          <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              class="h-9 px-3.5 text-[13px] font-normal text-slate-600 hover:bg-slate-100"
              @click="closeUpload"
            >
              Batal
            </Button>
            <Button
              type="button"
              :disabled="!selectedFile || processing"
              class="h-9 px-3.5 gap-1.5 text-[13px] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
              @click="processCsv"
            >
              <Upload class="size-3.5" aria-hidden="true" />
              {{ processing ? 'Menganalisis…' : 'Proses & Analisis' }}
            </Button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====================== Add Review Modal ====================== -->
    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-title"
          class="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200"
        >
          <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 id="add-title" class="text-[14px] font-bold text-slate-900">Tambah Review Manual</h2>
              <p class="text-[11.5px] text-slate-500">Masukkan 1 review untuk dianalisis modelnya</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              class="size-7 text-slate-400 hover:bg-slate-100"
              aria-label="Tutup dialog"
              @click="closeModal"
            >
              <X class="size-4" aria-hidden="true" />
            </Button>
          </div>

          <form class="px-5 py-4 space-y-3.5" @submit.prevent="submitAdd">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label for="f-marketplace" class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <ListFilter class="size-3.5 text-purple-500" aria-hidden="true" />
                  Marketplace <span class="text-rose-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="f-marketplace"
                  v-model="datasetChoice"
                  type="text"
                  placeholder="cth: Shopee, Tokopedia, Google Maps"
                  class="text-[13px]"
                />
              </div>
              <div>
                <Label for="f-model" class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Sparkles class="size-3.5 text-blue-500" aria-hidden="true" />
                  Model <span class="text-rose-500" aria-hidden="true">*</span>
                </Label>
                <Select v-model="modelChoice">
                  <SelectTrigger id="f-model" class="w-full bg-white text-[13px]" aria-label="Model klasifikasi">
                    <SelectValue placeholder="Pilih model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in allowedModels" :key="m" :value="m">{{ m }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label for="f-category" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Kategori <span class="text-rose-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="f-category"
                v-model="categoryChoice"
                type="text"
                placeholder="cth: Skincare, Elektronik, Restoran"
                class="text-[13px]"
              />
            </div>

            <div>
              <Label for="f-username" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Username <span class="text-rose-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="f-username"
                v-model="form.username"
                type="text"
                required
                autocomplete="off"
                placeholder="cth: budi_ganteng21"
                class="text-[13px]"
              />
            </div>

            <div>
              <span id="rating-label" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Rating <span class="text-rose-500" aria-hidden="true">*</span>
              </span>
              <div class="flex items-center gap-1.5" role="radiogroup" aria-labelledby="rating-label">
                <button
                  v-for="i in 5"
                  :key="i"
                  type="button"
                  role="radio"
                  :aria-checked="form.rating === i"
                  :aria-label="`${i} bintang — ${ratingLabels[i]}`"
                  :tabindex="form.rating === i || (!form.rating && i === 1) ? 0 : -1"
                  class="w-9 h-9 rounded-md border text-[16px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  :class="i <= form.rating
                    ? 'text-amber-400 border-amber-300 bg-amber-50'
                    : 'text-slate-400 border-slate-200 hover:border-amber-400 hover:text-amber-500'"
                  @click="form.rating = i"
                  @keydown.right.prevent="form.rating = Math.min(5, form.rating + 1)"
                  @keydown.left.prevent="form.rating = Math.max(1, form.rating - 1)"
                >
                  ★
                </button>
                <span class="text-[12px] text-slate-500 ml-1">
                  {{ form.rating ? `${form.rating} dari 5 — ${ratingLabels[form.rating]}` : 'Belum dipilih' }}
                </span>
              </div>
            </div>

            <div>
              <Label for="f-text" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Isi Review <span class="text-rose-500" aria-hidden="true">*</span>
              </Label>
              <textarea
                id="f-text"
                v-model="form.text"
                required
                rows="4"
                minlength="5"
                aria-describedby="f-text-hint"
                placeholder="Tulis isi review apa adanya..."
                class="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 resize-none"
              />
              <div id="f-text-hint" class="flex items-center justify-between mt-1">
                <span class="text-[11px] text-slate-400">Min. 5 karakter</span>
                <span class="text-[11px] text-slate-400 tabular-nums">{{ charCount }} chr</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label for="f-product" class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Produk <span class="text-slate-300 normal-case font-normal">(opsional)</span>
                </Label>
                <Input
                  id="f-product"
                  v-model="form.product"
                  type="text"
                  placeholder="cth: Serum X 30ml"
                  class="text-[13px]"
                />
              </div>
              <div>
                <Label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tanggal <span class="text-slate-300 normal-case font-normal">(opsional)</span>
                </Label>
                <DatePicker
                  v-model="reviewDate"
                  locale="id-ID"
                  placeholder="Pilih tanggal"
                  class="h-9 text-[13px] font-normal"
                />
              </div>
            </div>

            <div class="-mx-5 -mb-4 mt-1 px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                class="h-9 px-3.5 text-[13px] font-normal text-slate-600 hover:bg-slate-100"
                @click="closeModal"
              >
                Batal
              </Button>
              <Button
                type="submit"
                :disabled="submitting"
                class="h-9 px-3.5 gap-1.5 text-[13px] bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus class="size-3.5" aria-hidden="true" />
                {{ submitting ? 'Menganalisis…' : 'Tambah & Analisis' }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ====================== Detail Drawer ====================== -->
    <Teleport to="body">
      <div
        v-if="drawerReview"
        class="fixed inset-0 z-40 bg-slate-900/40 flex justify-end"
        @click.self="closeDrawer"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          class="bg-white w-full max-w-md h-full overflow-auto scroll-thin border-l border-slate-200 shadow-2xl"
        >
          <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
            <h2 id="drawer-title" class="text-[14px] font-bold text-slate-900">Detail Review</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              class="size-7 text-slate-400 hover:bg-slate-100"
              aria-label="Tutup detail"
              @click="closeDrawer"
            >
              <X class="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div class="p-5 space-y-4">
            <div class="flex items-start gap-3 pb-3 border-b border-slate-100">
              <span
                class="w-10 h-10 rounded-full text-[13px] font-bold inline-flex items-center justify-center shrink-0"
                :class="avatarClass(drawerReview.username)"
                aria-hidden="true"
              >{{ avatarInitials(drawerReview.username) }}</span>
              <div class="min-w-0 flex-1">
                <div class="text-[13.5px] font-bold text-slate-900">{{ drawerReview.username }}</div>
                <div class="text-[11.5px] text-slate-500">{{ drawerReview.product }} · {{ drawerReview.date || '—' }}</div>
                <div class="mt-1.5 inline-flex items-center gap-0.5" :aria-label="`Rating ${drawerReview.rating} dari 5`">
                  <Star
                    v-for="i in 5"
                    :key="i"
                    class="w-3 h-3"
                    :class="i <= drawerReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'"
                    aria-hidden="true"
                  />
                  <span class="ml-1 text-[11.5px] text-slate-500 tabular-nums">{{ drawerReview.rating }}.0</span>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded" :class="LABEL_META[drawerReview.label].badge">
                <span class="w-1.5 h-1.5 rounded-full" :class="LABEL_META[drawerReview.label].dot" aria-hidden="true" />
                {{ LABEL_META[drawerReview.label].text }}
              </span>
            </div>

            <div>
              <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Isi Review</div>
              <p class="text-[13px] text-slate-800 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3">{{ drawerReview.text }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="border border-slate-200 rounded-lg p-3">
                <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Confidence</div>
                <template v-if="drawerReview.confidence != null">
                  <div class="text-[20px] font-bold tabular-nums text-slate-900">{{ pctID(drawerReview.confidence) }}</div>
                  <div class="h-1.5 mt-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                    <div class="h-full" :class="LABEL_META[drawerReview.label].bar" :style="{ width: `${drawerReview.confidence}%` }" />
                  </div>
                </template>
                <template v-else>
                  <div class="text-[20px] font-bold tabular-nums text-slate-400">—</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">Tidak tersedia dari API</div>
                </template>
              </div>
              <div class="border border-slate-200 rounded-lg p-3">
                <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Panjang Teks</div>
                <div class="text-[20px] font-bold tabular-nums text-slate-900">{{ drawerReview.text.length }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ wordCount(drawerReview.text) }} kata</div>
              </div>
            </div>

            <div v-if="drawerReview.analysis">
              <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Analisis Model</div>
              <div class="border border-slate-200 rounded-lg p-3 space-y-2">
                <div class="flex flex-wrap items-center gap-2 text-[11.5px]">
                  <span class="text-slate-500">Sentimen review:</span>
                  <span class="font-semibold text-slate-900">{{ drawerReview.analysis.predictedSentiment }}</span>
                  <span class="text-slate-300" aria-hidden="true">·</span>
                  <span class="text-slate-500">Sentimen rating:</span>
                  <span class="font-semibold text-slate-900">{{ drawerReview.analysis.ratingSentiment }}</span>
                </div>
                <span
                  class="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded"
                  :class="drawerReview.analysis.isConsistent ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                >
                  {{ drawerReview.analysis.isConsistent ? 'Konsisten' : 'Tidak konsisten' }}
                </span>
                <p class="text-[12.5px] text-slate-700 leading-relaxed">{{ drawerReview.analysis.explanation }}</p>
              </div>
            </div>

            <div>
              <div class="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Saran Tindakan</div>
              <p class="text-[12.5px] text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 leading-relaxed">
                {{ suggestionFor(drawerReview.label, drawerReview.rating) }}
              </p>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                class="h-9 flex-1 text-[13px] font-normal border-slate-200 text-slate-700 hover:bg-slate-50"
                @click="markLabel('genuine')"
              >
                Tandai Genuine
              </Button>
              <Button
                type="button"
                class="h-9 flex-1 text-[13px] bg-rose-600 text-white hover:bg-rose-700"
                @click="markLabel('fake')"
              >
                Tandai Fake
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
