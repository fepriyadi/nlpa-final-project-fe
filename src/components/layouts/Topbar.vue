<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const route = useRoute()
const isVisible = ref(true)
const lastScrollPosition = ref(0)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

const activeTab = computed(() => {
  const path = route.path
  if (path.includes('/client')) return 'client'
  if (path.includes('/corporate')) return 'corporate'
  if (path.includes('/tracking-package')) return 'tracking-package'
  if (path.includes('/payment-status')) return 'payment-status'
  return 'corporate'
})

function switchTab(path: string) {
  router.push(path)
}

function handleScroll() {
  if (scrollTimeout) return

  scrollTimeout = setTimeout(() => {
    const currentScrollPosition = window.scrollY
    const scrollDifference = currentScrollPosition - lastScrollPosition.value

    if (scrollDifference > 50) {
      // Scrolling down more than 50px
      isVisible.value = false
    } else if (scrollDifference < -50) {
      // Scrolling up more than 50px
      isVisible.value = true
    }

    lastScrollPosition.value = currentScrollPosition
    scrollTimeout = null
  }, 100)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})
</script>

<template>
  <!-- TOP NAVIGATION BAR -->
  <nav
    class="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50 transition-transform duration-300 ease-in-out w-full"
    :class="isVisible ? 'translate-y-0' : '-translate-y-full'"
  >
    <div class="max-w-400 mx-auto px-4 md:px-6 lg:px-8">
      <div class="flex items-center h-16 gap-4 md:gap-6">
        <!-- Tabs -->
        <button
          @click="switchTab('/corporate')"
          class="h-full px-3 md:px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm md:text-base border-b-3"
          :class="activeTab === 'corporate' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent text-gray-500 font-medium'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analisa Corporate
        </button>
        <button
          @click="switchTab('/client')"
          class="h-full px-3 md:px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm md:text-base border-b-3"
          :class="activeTab === 'client' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent text-gray-500 font-medium'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Klien Detail
        </button>
        <button
          @click="switchTab('/tracking-package')"
          class="h-full px-3 md:px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm md:text-base border-b-3"
          :class="activeTab === 'tracking-package' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent text-gray-500 font-medium'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Pelacakan Paket
        </button>
        <button
          @click="switchTab('/payment-status')"
          class="h-full px-3 md:px-4 flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm md:text-base border-b-3"
          :class="activeTab === 'payment-status' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent text-gray-500 font-medium'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Status Pembayaran
        </button>
      </div>
    </div>
  </nav>
</template>
