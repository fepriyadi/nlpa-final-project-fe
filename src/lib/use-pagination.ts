import { computed, ref, type Ref } from 'vue'

export function usePagination(totalItems: Ref<number>, pageSize: Ref<number>, noun = 'baris') {
  const currentPage = ref(1)

  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)))

  const pageStart = computed(() => {
    if (totalItems.value === 0) return 0
    return (currentPage.value - 1) * pageSize.value + 1
  })

  const pageEnd = computed(() => Math.min(currentPage.value * pageSize.value, totalItems.value))

  const rangeText = computed(() =>
    totalItems.value === 0
      ? 'Tidak ada data'
      : `Menampilkan ${pageStart.value} sampai ${pageEnd.value} dari ${totalItems.value} ${noun}`,
  )

  const pageNumbers = computed(() => {
    const total = totalPages.value
    const current = currentPage.value
    const max = Math.min(5, total)
    let start = Math.max(1, current - 2)
    const end = Math.min(total, start + max - 1)
    start = Math.max(1, end - max + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  function onPageChange(page: number) {
    if (page < 1 || page > totalPages.value || page === currentPage.value) return
    currentPage.value = page
  }

  return { currentPage, totalPages, pageStart, pageEnd, rangeText, pageNumbers, onPageChange }
}
