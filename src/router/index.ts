import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/Blank.vue'),
      meta: { requiresAuth: false },
      children: [
        {
          path: '',
          redirect: '/home',
        },
        {
          path: '/home',
          name: 'Home',
          component: () => import('@/views/Home/Index.vue'),
        },
        // Add your routes here
      ],
    },
    {
      path: '/forbidden',
      name: 'Forbidden',
      component: () => import('@/views/Forbidden/Index.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound/Index.vue'),
      meta: { requiresAuth: false },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  // No login required — load the profile only if a token is already present
  // (e.g. injected by an upstream SSO), otherwise go straight through.
  if (to.meta.requiresAuth && localStorage.getItem('token')) {
    const userStore = useUserStore()
    if (!userStore.isLoaded) {
      try {
        await userStore.fetchProfile()
      } catch {
        // Auth interceptor handles 401/403 cleanup
      }
    }
  }

  next()
})

export default router
