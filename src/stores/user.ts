import { defineStore } from 'pinia'
import { getMe } from '@/services/auth'
import type { UserPermissions, UserProfile, UserPublic } from '@/types/auth'

const STORAGE_KEY = 'userProfile'

interface State {
  user: UserPublic | null
  permissions: UserPermissions | null
  loading: boolean
}

const loadFromStorage = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: (): State => {
    const cached = loadFromStorage()
    return {
      user: cached?.user ?? null,
      permissions: cached?.permissions ?? null,
      loading: false,
    }
  },
  getters: {
    isLoaded: (state) => state.user !== null,
    fullName: (state) => state.user?.fullName ?? '',
    email: (state) => state.user?.email ?? '',
    role: (state) => state.user?.role ?? null,
  },
  actions: {
    async fetchProfile(force = false): Promise<UserProfile | null> {
      if (this.user && !force) {
        return { user: this.user, permissions: this.permissions! }
      }

      this.loading = true
      try {
        const { data } = await getMe()
        const profile = data.data
        this.user = profile.user
        this.permissions = profile.permissions
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
        return profile
      } finally {
        this.loading = false
      }
    },
    clear() {
      this.user = null
      this.permissions = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
