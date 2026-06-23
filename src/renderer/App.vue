<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">📝 {{ $t('app.title') }}</div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="sidebar-link"
          :class="{ active: $route.path === item.path }"
        >
          <span class="icon">{{ item.icon }}</span>
          <span>{{ $t(item.labelKey) }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="lang-switcher">
          <button
            class="lang-btn"
            :class="{ active: locale === 'zh-CN' }"
            @click="switchLang('zh-CN')"
          >中</button>
          <button
            class="lang-btn"
            :class="{ active: locale === 'en' }"
            @click="switchLang('en')"
          >EN</button>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from './stores/categoryStore'

const { locale, t } = useI18n()
const categoryStore = useCategoryStore()

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
  { path: '/import', labelKey: 'nav.import', icon: '📥' },
  { path: '/categories', labelKey: 'nav.categories', icon: '📁' },
  { path: '/organize', labelKey: 'nav.organize', icon: '🎯' },
  { path: '/quiz/setup', labelKey: 'nav.quiz', icon: '✏️' },
  { path: '/mastered', labelKey: 'nav.mastered', icon: '✅' },
  { path: '/backup', labelKey: 'nav.backup', icon: '💾' }
]

onMounted(async () => {
  await categoryStore.initializeDefaultCategories(
    t('common.unclassified'),
    t('mastered.title')
  )
})

function switchLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}
</script>

<style scoped>
.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.lang-switcher {
  display: flex;
  gap: 4px;
}

.lang-btn {
  flex: 1;
  padding: 6px 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.lang-btn:hover {
  border-color: var(--color-primary);
}

.lang-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
</style>
