<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

const closeSidebar = () => {
  isOpen.value = false
}
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Mobile Menu Button -->
    <button
      v-show="!isOpen"
      @click="toggleSidebar"
      class="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-sidebar border border-sidebar-border hover:bg-sidebar-accent transition-colors"
      aria-label="Toggle sidebar"
    >
      <svg
        v-if="!isOpen"
        class="w-6 h-6 text-sidebar-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg
        v-else
        class="w-6 h-6 text-sidebar-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Overlay for mobile -->
    <div
      v-if="isOpen"
      @click="closeSidebar"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:static w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 z-40 lg:z-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Header Section -->
      <div class="p-6 border-b border-sidebar-border">
        <div class="flex items-center justify-between">
          <slot name="header">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center">
                <span class="text-sm font-bold text-sidebar-primary-foreground">SM</span>
              </div>
              <h1 class="text-lg font-bold text-sidebar-foreground">Dashboard</h1>
            </div>
          </slot>
          <button
            @click="closeSidebar"
            class="lg:hidden p-1 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            aria-label="Close sidebar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content Section -->
      <nav class="flex-1 overflow-y-auto p-6">
        <slot name="content">
          <div class="space-y-2">
            <a
              href="#"
              class="flex items-center gap-3 px-4 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4V3" />
              </svg>
              <span>Overview</span>
            </a>
            <a
              href="#"
              class="flex items-center gap-3 px-4 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics</span>
            </a>
            <a
              href="#"
              class="flex items-center gap-3 px-4 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Reports</span>
            </a>
          </div>
        </slot>
      </nav>

      <!-- Footer Section -->
      <div class="p-6 border-t border-sidebar-border">
        <slot name="footer">
          <button class="w-full flex items-center gap-2 px-4 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </slot>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
      <main class="flex-1 overflow-auto">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Smooth scrollbar for content section */
nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: rgb(from var(--sidebar-border) r g b / 0.5);
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: rgb(from var(--sidebar-border) r g b / 0.7);
}
</style>
