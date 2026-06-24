<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('quiz.setup.title') }}</h1>
    </div>

    <div class="card" style="max-width: 500px">
      <h3 style="margin-bottom: 16px">{{ $t('quiz.setup.selectCategory') }}</h3>

      <div v-if="categoryStore.sortedCategories.length === 0" class="empty-state" style="padding: 20px">
        <p>{{ $t('quiz.setup.noCategories') }}</p>
        <router-link to="/import" class="btn btn-primary" style="margin-top: 12px">{{ $t('common.goImport') }}</router-link>
      </div>

      <div v-else>
        <label class="checkbox-item" style="border-bottom: 1px solid var(--color-border); padding-bottom: 8px; margin-bottom: 4px">
          <input type="checkbox" :checked="allSelected" @change="toggleAll" />
          <strong>{{ $t('quiz.setup.selectAll') }}</strong>
        </label>
        <label
          v-for="cat in categoryStore.sortedCategories"
          :key="cat.id"
          class="checkbox-item"
        >
          <input
            type="checkbox"
            :value="cat.id"
            v-model="selectedCategories"
          />
          <span>{{ cat.icon || '📁' }} {{ getCategoryDisplayName(cat.name) }}</span>
          <span class="tag" style="margin-left: auto">{{ categoryCounts[cat.id!] || 0 }}</span>
        </label>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border)">
        <label class="checkbox-item">
          <input type="checkbox" v-model="shuffle" />
          <span>{{ $t('quiz.setup.randomOrder') }}</span>
        </label>
      </div>

      <div style="margin-top: 24px; display: flex; align-items: center; gap: 16px">
        <button
          class="btn btn-primary btn-lg"
          @click="startQuiz"
          :disabled="selectedCategories.length === 0 || estimatedCount === 0"
        >
          {{ $t('quiz.setup.startQuiz') }}
        </button>
        <span style="font-size: 14px; color: var(--color-text-secondary)">
          {{ $t('quiz.setup.questionsAvailable', { count: estimatedCount }) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from '../stores/categoryStore'
import { useQuizStore } from '../stores/quizStore'
import { db } from '../db/database'

const router = useRouter()
const { t } = useI18n()
const categoryStore = useCategoryStore()
const quizStore = useQuizStore()

const selectedCategories = ref<number[]>([])
const shuffle = ref(true)
const categoryCounts = ref<Record<number, number>>({})
const estimatedCount = ref(0)

const allSelected = computed(() => {
  return categoryStore.sortedCategories.length > 0 &&
    selectedCategories.value.length === categoryStore.sortedCategories.length
})

function toggleAll() {
  if (allSelected.value) {
    selectedCategories.value = []
  } else {
    selectedCategories.value = categoryStore.sortedCategories.map(c => c.id!)
  }
}

onMounted(async () => {
  await categoryStore.loadCategories()
  for (const cat of categoryStore.categories) {
    if (cat.id) {
      const count = await db.questions.where('categoryId').equals(cat.id).count()
      categoryCounts.value[cat.id] = count
    }
  }
})

watch(selectedCategories, async () => {
  let total = 0
  for (const catId of selectedCategories.value) {
    const count = await db.questions.where('categoryId').equals(catId).count()
    total += count
  }
  estimatedCount.value = total
}, { immediate: true })

function getCategoryDisplayName(name: string): string {
  if (name === 'Uncategorized') return t('common.unclassified')
  if (name === 'Mastered') return t('mastered.title')
  return name
}

async function startQuiz() {
  if (selectedCategories.value.length === 0) return
  await quizStore.startQuiz({
    categoryIds: selectedCategories.value,
    includeMastered: true,
    shuffle: shuffle.value
  })
  router.push('/quiz/play')
}
</script>

<style scoped>
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}
</style>
