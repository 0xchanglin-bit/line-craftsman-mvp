import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/components/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/role-selection',
    name: 'RoleSelection',
    component: () => import('@/components/RoleSelectionPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/seeker',
    name: 'SeekerDashboard',
    component: () => import('@/components/SeekerDashboard.vue'),
    meta: { requiresAuth: true, role: 'seeker' },
  },
  {
    path: '/seeker/create',
    name: 'CreateCase',
    component: () => import('@/components/CreateCasePage.vue'),
    meta: { requiresAuth: true, role: 'seeker' },
  },
  {
    path: '/seeker/case/:id',
    name: 'CaseDetail',
    component: () => import('@/components/CaseDetailPage.vue'),
    meta: { requiresAuth: true, role: 'seeker' },
  },
  {
    path: '/craftsman',
    name: 'CraftsmanDashboard',
    component: () => import('@/components/CraftsmanDashboard.vue'),
    meta: { requiresAuth: true, role: 'craftsman' },
  },
  {
    path: '/craftsman/skills',
    name: 'CraftsmanSkillsEdit',
    component: () => import('@/components/CraftsmanSkillsEdit.vue'),
    meta: { requiresAuth: true, role: 'craftsman' },
  },
  {
    path: '/craftsman/case/:id',
    name: 'CaseDetailForCraftsman',
    component: () => import('@/components/CaseDetailForCraftsman.vue'),
    meta: { requiresAuth: true, role: 'craftsman' },
  },
  {
    path: '/craftsman/apply',
    name: 'CraftsmanApply',
    component: () => import('@/components/CraftsmanApplicationForm.vue'),
    meta: { requiresAuth: true, role: 'craftsman' },
  },
  {
    path: '/craftsman/application-status',
    name: 'CraftsmanApplicationStatus',
    component: () => import('@/components/CraftsmanApplicationStatus.vue'),
    meta: { requiresAuth: true, role: 'craftsman' },
  },
  {
    path: '/admin/applications',
    name: 'AdminApplications',
    component: () => import('@/components/AdminApplicationsPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/',
    redirect: () => {
      const token = localStorage.getItem('jwt');
      const role  = localStorage.getItem('userRole');
      if (!token) return '/login';
      if (!role)  return '/role-selection';
      return role === 'craftsman' ? '/craftsman' : '/seeker';
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const token    = localStorage.getItem('jwt');
  const userRole = localStorage.getItem('userRole');

  // 未登入 → /login
  if (to.meta.requiresAuth && !token) return '/login';

  // 已登入嘗試進 /login → 還原到正確頁
  if (to.path === '/login' && token) {
    if (!userRole) return '/role-selection';
    return userRole === 'craftsman' ? '/craftsman' : '/seeker';
  }

  // 需要特定角色但 userRole 不符 → 身份選擇
  if (to.meta.role && userRole && to.meta.role !== userRole) {
    return '/role-selection';
  }

  // 需要管理員權限 → 驗證
  if (to.meta.requiresAdmin) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.is_admin) return '/';
    } catch {
      return '/';
    }
  }
});

export default router;
