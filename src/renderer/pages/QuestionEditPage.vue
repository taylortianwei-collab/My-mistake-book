<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('common.back') }} <router-link to="/categories" style="color: var(--color-text-muted); font-size: 13px; text-decoration: none">{{ $t('categoryDetail.backToCategories') }}</router-link></h1>
      <h1 class="page-title" style="margin-top: 4px">{{ $t('categoryDetail.editQuestion') }}</h1>
    </div>

    <div v-if="question" class="card" style="max-width: 600px">
      <img :src="imageSrc" style="max-width: 100%; max-height: 400px; margin-bottom: 16px; border-radius: var(--radius-sm)" />
      <div style="margin-bottom: 12px">
        <label style="display: block; margin-bottom: 4px; font-size: 13px; color: var(--color-text-secondary)">{{ $t('categoryDetail.correctAnswer') }}</label>
        <input v-model="answer" class="input" :placeholder="$t('categoryDetail.correctAnswerPlaceholder')" />
      </div>
      <div style="margin-bottom: 12px">
        <label style="display: block; margin-bottom: 4px; font-size: 13px; color: var(--color-text-secondary)">{{ $t('categoryDetail.notes') }}</label>
        <textarea v-model="notes" class="input" rows="3" :placeholder="$t('categoryDetail.notesPlaceholder')"></textarea>
      </div>
      <div style="display: flex; gap: 8px">
        <button class="btn btn-primary" @click="save">{{ $t('common.save') }}</button>
        <router-link :to="`/categories`" class="btn btn-secondary">{{ $t('common.cancel') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuestionStore } from '../stores/questionStore'
import { db } from '../db/database'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const questionStore = useQuestionStore()

const questionId = Number(route.params.id)
const question = ref<any>(null)
const answer = ref('')
const notes = ref('')
const imageSrc = ref('')

onMounted(async () => {
  const q = questionStore.getQuestionById(questionId) || await db.questions.get(questionId)
  if (q) {
    question.value = q
    answer.value = q.correctAnswer
    notes.value = q.notes
    if (q.imageData) {
      imageSrc.value = URL.createObjectURL(q.imageData)
    }
  }
})

async function save() {
  await questionStore.updateQuestion(questionId, {
    correctAnswer: answer.value,
    notes: notes.value
  })
  router.push('/categories')
}
</script>
