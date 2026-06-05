<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const mobileOpen = ref(false)

const headerVisible = ref(true)
provide('headerVisible', headerVisible)

interface NavItem {
  path: string
  label: string
  icon: string
}

// Add your nav items here
const navItems: NavItem[] = [
  {
    path: '/home',
    label: 'Home',
    icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
  },
]

const greeting = computed(() => {
  const name = userStore.fullName?.trim()
  if (!name) return ''
  const firstName = name.split(/\s+/)[0]
  return `Hi, ${firstName}`
})

const initials = computed(() => {
  const name = userStore.fullName?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
})

const isSsoMode = computed(() => localStorage.getItem('authMode') === 'sso')

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
  mobileOpen.value = false
}

function logout() {
  userStore.clear()
  localStorage.removeItem('token')
  router.replace('/home')
  mobileOpen.value = false
}
</script>

<template>
  <div class="flex flex-col h-screen bg-[#f1f5f9]">
    <!-- Topbar -->
    <header
      class="bg-[#1B1D2E] text-white flex items-center px-4 lg:px-6 shrink-0 border-b border-white/5 overflow-hidden transition-[max-height] duration-200 ease-out"
      :class="headerVisible ? 'max-h-14' : 'max-h-0'"
    >
      <!-- Brand -->
      <button
        class="flex items-center gap-2.5 mr-6 shrink-0"
        @click="navigate(navItems[0]?.path ?? '/')"
      >
        <div class="text-left leading-tight">
          <p class="text-[9px] font-semibold text-white/40 uppercase tracking-widest">APP</p>
          <h1 class="text-sm font-bold text-white">NLPA Final Project</h1>
        </div>
      </button>

      <!-- Desktop nav -->
      <nav class="hidden lg:flex items-center gap-1 flex-1">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="inline-flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium transition-colors"
          :class="isActive(item.path)
            ? 'bg-white/10 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/5'"
          @click="navigate(item.path)"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="item.icon" class="shrink-0" />
          {{ item.label }}
        </button>
      </nav>

      <div class="flex-1 lg:flex-none" />

      <!-- Right cluster -->
      <div class="hidden lg:flex items-center gap-3">
        <div v-if="userStore.fullName" class="flex items-center gap-2 pr-3 border-r border-white/10">
          <div class="w-7 h-7 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
            {{ initials }}
          </div>
          <span class="text-white/80 text-sm font-medium">{{ greeting }}</span>
        </div>
        <button
          v-if="!isSsoMode"
          class="inline-flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium text-red-200 hover:text-red-100 hover:bg-red-500/15 transition-colors"
          @click="logout"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
          </svg>
          Logout
        </button>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="lg:hidden p-2 rounded-md hover:bg-white/5 transition-colors"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
      >
        <svg v-if="!mobileOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>

    <!-- Mobile menu -->
    <div
      v-if="mobileOpen"
      class="lg:hidden bg-[#1a1d2e] text-white border-b border-white/5 px-3 py-3 space-y-1"
    >
      <button
        v-for="item in navItems"
        :key="item.path"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
        :class="isActive(item.path)
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/5'"
        @click="navigate(item.path)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="item.icon" class="shrink-0" />
        {{ item.label }}
      </button>
      <div class="border-t border-white/10 my-2" />
      <button
        v-if="!isSsoMode"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left text-red-200 hover:text-red-100 hover:bg-red-500/15"
        @click="logout"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
        </svg>
        Logout
      </button>
    </div>

    <!-- Main content -->
    <main class="flex-1 overflow-auto">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>
