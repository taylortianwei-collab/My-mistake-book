<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('mastered.title') }}</h1>
    </div>

    <div v-if="masteredQuestions.length === 0" class="empty-state">
      <div class="icon">✅</div>
      <div class="title">{{ $t('mastered.noMastered') }}</div>
      <div class="desc">{{ $t('mastered.noMasteredDesc') }}</div>
    </div>

    <div v-else class="grid-images">
      <div
        v-for="q in masteredQuestions"
        :key="q.id"
        class="image-card mastered-card"
      >
        <img :src="imageDataUrls[q.id!] || ''" :alt="q.imageName" />
        <div class="image-card-info">
          {{ q.imageName }}
          <button class="btn btn-sm btn-secondary" style="float: right; margin-top: -2px" @click="unmark(q.id!)">
            {{ $t('mastered.unmarkMastered') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuestionStore } from '../stores/questionStore'
import { useCategoryStore } from '../stores/categoryStore'
import { db, type Question } from '../db/database'

const { t } = useI18n()
const questionStore = useQuestionStore()
const categoryStore = useCategoryStore()

const masteredQuestions = ref<Question[]>([])
const imageDataUrls = reactive<Record<number, string>>({})

onMounted(async () => {
  await categoryStore.loadCategories()
  await loadMastered()
})

async function loadMastered() {
  const masteredCat = categoryStore.categories.find(c => c.name === 'Mastered')
  if (!masteredCat) {
    masteredQuestions.value = []
    return
  }

  masteredQuestions.value = await db.questions.where('categoryId').equals(masteredCat.id!).toArray()

  for (const url of Object.values(imageDataUrls)) {
    URL.revokeObjectURL(url)
  }

  for (const q of masteredQuestions.value) {
    if (q.id && q.imageData) {
      imageDataUrls[q.id] = URL.createObjectURL(q.imageData)
    }
  }
}

async function unmark(id: number) {
  const uncat = categoryStore.categories.find(c => c.name === t('common.unclassified'))
  if (uncat) {
    await questionStore.updateQuestion(id, {
      categoryId: uncat.id!,
      isMastered: false,
      masteredAt: null
    })
  }
  await loadMastered()
}
</script>

<style scoped>
.mastered-card {
  opacity: 0.85;
}

.mastered-card:hover {
  opacity: 1;
}
</style>
