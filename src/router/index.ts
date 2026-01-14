import { createRouter, createWebHistory } from 'vue-router'

// 화면 컴포넌트
import LoginView from '../views/Login.vue'
import ErrorManageView from '../views/ErrorManage.vue'
import ErrorAiAnalysis from '../views/ErrorAiAnalysis.vue'
import AiImageAnalysis from '../views/AiImageAnalysis.vue'
import AiHistoryList from '../views/AiHistoryList.vue'
import AiHistoryDetail from '../views/AiHistoryDetail.vue'
import DashboardView from '../views/Dashboard.vue'
import AiSmartSearch from '../views/AiSmartSearch.vue'
import AiPredictiveMaintenance from '../views/AiPredictiveMaintenance.vue';
import AiLearningManage from '../views/AiLearningManage.vue';
import AiCodeReview from '../views/AiCodeReview.vue';
import AiSmartInsight from '../views/AiSmartInsight.vue';

const routes = [
  {
    path: '/',
    redirect: '/errors'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/dashboard', 
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/errors',
    name: 'ErrorManage',
    component: ErrorManageView,
    meta: { requiresAuth: true }
  },
  {
    path: '/errors/ai-analysis',
    name: 'ErrorAiAnalysis',
    component: ErrorAiAnalysis,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/search',
    name: 'AiSmartSearch',
    component: AiSmartSearch,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/predict',
    name: 'AiPredictiveMaintenance',
    component: AiPredictiveMaintenance,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/insight',
    name: 'AiSmartInsight',
    component: AiSmartInsight,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/learn',
    name: 'AiLearningManage',
    component: AiLearningManage,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/code-review',
    name: 'AiCodeReview',
    component: AiCodeReview,
    meta: { requiresAuth: true }
  },  
  {
    path: '/ai/image',
    name: 'AiImageAnalysis',
    component: AiImageAnalysis,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/history',
    name: 'AiHistoryList',
    component: AiHistoryList,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai/history/:id',
    name: 'AiHistoryDetail',
    component: AiHistoryDetail,
    meta: { requiresAuth: true },
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 🔐 전역 Router Guard
 */
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('accessToken')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router