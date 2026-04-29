import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('@/views/Suppliers.vue'),
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
      },
      {
        path: 'items',
        name: 'Items',
        component: () => import('@/views/Items.vue'),
      },
      {
        path: 'consult-projects',
        name: 'ConsultProjects',
        component: () => import('@/views/ConsultProjects.vue'),
      },
      {
        path: 'consult-projects/:id',
        name: 'ConsultProjectDetail',
        component: () => import('@/views/ConsultProjectDetail.vue'),
      },
      {
        path: 'bid-projects',
        name: 'BidProjects',
        component: () => import('@/views/BidProjects.vue'),
      },
      {
        path: 'bid-projects/:id',
        name: 'BidProjectDetail',
        component: () => import('@/views/BidProjectDetail.vue'),
      },
      {
        path: 'payments',
        name: 'Payments',
        component: () => import('@/views/Payments.vue'),
      },
      {
        path: 'price-query',
        name: 'PriceQuery',
        component: () => import('@/views/PriceQuery.vue'),
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
      },
      {
        path: 'notifications/settings',
        name: 'NotificationSettings',
        component: () => import('@/views/NotificationSettings.vue'),
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
