import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue')
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../pages/CategoriesPage.vue')
    },
    {
      path: '/categories/:id',
      name: 'category-detail',
      component: () => import('../pages/CategoryDetailPage.vue')
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('../pages/ImportPage.vue')
    },
    {
      path: '/organize',
      name: 'organize',
      component: () => import('../pages/OrganizePage.vue')
    },
    {
      path: '/question/:id/edit',
      name: 'question-edit',
      component: () => import('../pages/QuestionEditPage.vue')
    },
    {
      path: '/quiz/setup',
      name: 'quiz-setup',
      component: () => import('../pages/QuizSetupPage.vue')
    },
    {
      path: '/quiz/play',
      name: 'quiz-play',
      component: () => import('../pages/QuizPlayPage.vue')
    },
    {
      path: '/quiz/result',
      name: 'quiz-result',
      component: () => import('../pages/QuizResultPage.vue')
    },
    {
      path: '/mastered',
      name: 'mastered',
      component: () => import('../pages/MasteredPage.vue')
    },
    {
      path: '/backup',
      name: 'backup',
      component: () => import('../pages/BackupPage.vue')
    }
  ]
})

export default router
