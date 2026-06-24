<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('dashboard.title') }}</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ totalQuestions }}</div>
        <div class="stat-label">{{ $t('dashboard.totalQuestions') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: var(--color-success)">{{ masteredCount }}</div>
        <div class="stat-label">{{ $t('dashboard.mastered') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: var(--color-warning)">{{ remainingCount }}</div>
        <div class="stat-label">{{ $t('dashboard.pending') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ categoryCount }}</div>
        <div class="stat-label">{{ $t('dashboard.categories') }}</div>
      </div>
    </div>

    <div v-if="totalQuestions > 0" style="margin-top: 24px">
      <div class="card">
        <h3 style="margin-bottom: 14px">{{ $t('dashboard.masteryProgress') }}</h3>
        <div class="progress-bar-container">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: masteryPercent + '%' }"></div>
          </div>
          <span class="progress-bar-text">{{ masteryPercent }}%</span>
        </div>
      </div>

      <div class="card" style="margin-top: 16px">
        <h3 style="margin-bottom: 14px">{{ $t('dashboard.categoryDistribution') }}</h3>
        <div v-if="categoryStats.length === 0" style="padding: 12px; text-align: center; color: var(--color-text-muted)">{{ $t('dashboard.noCategoryData') }}</div>
        <div v-else class="category-bars">
          <div v-for="stat in categoryStats" :key="stat.name" class="category-bar-row">
            <router-link :to="`/categories/${stat.id}`" class="category-bar-name">{{ stat.name }}</router-link>
            <div class="category-bar-track">
              <div class="category-bar-fill" :style="{ width: stat.percent + '%' }"></div>
            </div>
            <span class="category-bar-count">{{ stat.count }}{{ $t('dashboard.questions') }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalQuestions === 0" class="card" style="margin-top: 24px; text-align: center; padding: 40px">
      <div style="font-size: 48px; margin-bottom: 12px">📝</div>
      <h3 style="margin-bottom: 8px">{{ $t('dashboard.startUsing') }}</h3>
      <p style="color: var(--color-text-secondary); margin-bottom: 16px">{{ $t('dashboard.startDesc') }}</p>
      <router-link to="/import" class="btn btn-primary btn-lg">{{ $t('dashboard.importImages') }}</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { db } from '../db/database'

const { t } = useI18n()

const totalQuestions = ref(0)
const masteredCount = ref(0)
const categoryCount = ref(0)
const categoryStats = ref<Array<{ id: number; name: string; count: number; percent: number }>>([])

const remainingCount = computed(() => totalQuestions.value - masteredCount.value)
const masteryPercent = computed(() => totalQuestions.value === 0 ? 0 : Math.round((masteredCount.value / totalQuestions.value) * 100))

onMounted(async () => {
  totalQuestions.value = await db.questions.count()
  masteredCount.value = await db.questions.where('isMastered').equals(1).count()
  categoryCount.value = await db.categories.count()

  const categories = await db.categories.toArray()
  const counts = await Promise.all(
    categories.map(async c => ({
      id: c.id!,
      name: c.name === 'Uncategorized' ? t('common.unclassified') : c.name === 'Mastered' ? t('mastered.title') : c.name,
      count: await db.questions.where('categoryId').equals(c.id!).count(),
      percent: 0
    }))
  )

  const maxCount = Math.max(...counts.map(c => c.count), 1)
  counts.forEach(c => { c.percent = Math.round((c.count / maxCount) * 100) })
  categoryStats.value = counts.filter(c => c.count > 0).sort((a, b) => b.count - a.count)
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-track {
  flex: 1;
  height: 10px;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-bar-text {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 40px;
}

.category-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-bar-name {
  width: 130px;
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: right;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-bar-name:hover {
  color: var(--color-primary);
}

.category-bar-track {
  flex: 1;
  height: 18px;
  background: var(--color-border-light);
  border-radius: 9999px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.category-bar-count {
  width: 45px;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
