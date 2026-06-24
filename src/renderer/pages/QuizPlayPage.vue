<template>
  <div>
    <div v-if="!currentQuestion && !finished" class="empty-state">
      <div class="icon">✏️</div>
      <div class="title">{{ $t('quiz.play.noQuestions') }}</div>
      <div class="desc">{{ $t('quiz.play.noQuestionsDesc') }}</div>
      <router-link to="/quiz/setup" class="btn btn-primary" style="margin-top: 12px">{{ $t('quiz.play.backToSetup') }}</router-link>
    </div>

    <div v-if="finished" class="finished-state">
      <div class="icon" style="font-size: 64px">🎉</div>
      <div class="title" style="font-size: 24px">{{ $t('quiz.play.quizComplete') }}</div>
      <div class="desc">{{ $t('quiz.play.result', { correct: correctCount, total }) }}</div>
      <div style="display: flex; gap: 8px; margin-top: 16px">
        <router-link to="/quiz/result" class="btn btn-primary">{{ $t('quiz.play.viewResult') }}</router-link>
        <router-link to="/quiz/setup" class="btn btn-secondary">{{ $t('quiz.play.tryAgain') }}</router-link>
      </div>
    </div>

    <div v-else-if="currentQuestion">
      <div class="quiz-progress">
        <button class="btn btn-secondary btn-sm" @click="abandonQuiz">{{ $t('quiz.play.abandon') }}</button>
        <span style="font-size: 13px; color: var(--color-text-secondary); min-width: 80px; text-align: center">
          {{ currentIndex + 1 }} / {{ total }}
        </span>
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="tag">{{ currentCategoryName }}</span>
      </div>

      <div class="quiz-content">
        <div class="quiz-image-container" @click="openImageLightbox">
          <img :src="currentImageSrc" class="quiz-image" />
        </div>

        <div class="quiz-answer-area">
          <div class="answer-input-group">
            <input
              v-model="userAnswer"
              class="input answer-input"
              :class="{ 'input-correct': showResult && isCorrect, 'input-wrong': showResult && !isCorrect }"
              :placeholder="$t('quiz.play.answerPlaceholder')"
              @keyup.enter="showResult ? nextQuestion() : checkAnswer()"
              :disabled="showResult"
              ref="answerInput"
              autofocus
            />
          </div>

          <div v-if="showResult" class="quiz-result" :class="isCorrect ? 'result-correct' : 'result-wrong'">
            <div class="result-icon">{{ isCorrect ? '✓' : '✗' }}</div>
            <div class="result-text">
              <div style="font-weight: 600">{{ isCorrect ? $t('quiz.play.correct') : $t('quiz.play.wrong') }}</div>
              <div style="font-size: 14px; margin-top: 4px; opacity: 0.8">
                {{ $t('quiz.play.correctAnswer') }}：<strong>{{ currentQuestion.correctAnswer || $t('quiz.play.notFilled') }}</strong>
              </div>
            </div>
          </div>

          <div class="quiz-actions">
            <template v-if="!showResult">
              <button class="btn btn-primary btn-lg" @click="checkAnswer" :disabled="!userAnswer.trim()">
                {{ $t('quiz.play.submitAnswer') }}
              </button>
              <button class="btn btn-secondary" @click="revealAnswer">{{ $t('quiz.play.showAnswer') }}</button>
            </template>
            <template v-else>
              <button class="btn btn-primary btn-lg" @click="nextQuestion">
                {{ isLastQuestion ? $t('quiz.play.finish') : $t('quiz.play.nextQuestion') }}
              </button>
              <button v-if="!currentQuestion.isMastered" class="btn btn-success" @click="markMastered">
                {{ $t('quiz.play.markMastered') }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Lightbox -->
    <Teleport to="body">
      <div v-if="showImageLightbox" class="lightbox-overlay" @click="closeImageLightbox">
        <div class="lightbox-content">
          <button class="lightbox-close" @click="closeImageLightbox">✕</button>
          <img :src="currentImageSrc" class="lightbox-image" @click.stop />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '../stores/quizStore'
import { useQuestionStore } from '../stores/questionStore'
import { useCategoryStore } from '../stores/categoryStore'
import { db, type Question } from '../db/database'

const router = useRouter()
const { t } = useI18n()
const quizStore = useQuizStore()
const questionStore = useQuestionStore()
const categoryStore = useCategoryStore()

const currentQuestion = ref<Question | null>(null)
const currentImageSrc = ref('')
const currentCategoryName = ref('')
const userAnswer = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const showImageLightbox = ref(false)
const finished = ref(false)
const correctCount = ref(0)

const currentIndex = computed(() => quizStore.currentQuestionIndex)
const total = computed(() => quizStore.quizQuestions.length)
const isLastQuestion = computed(() => currentIndex.value >= total.value - 1)
const progressPercent = computed(() => total.value === 0 ? 0 : ((currentIndex.value + 1) / total.value) * 100)

const startTime = ref(Date.now())
const answerInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  if (quizStore.quizQuestions.length === 0) return
  await categoryStore.loadCategories()
  await loadCurrentQuestion()
})

onUnmounted(() => {})

async function loadCurrentQuestion() {
  const qid = quizStore.getCurrentQuestionId()
  if (!qid) {
    await finishQuiz()
    return
  }

  const q = await db.questions.get(qid)
  if (!q) {
    quizStore.nextQuestion()
    await loadCurrentQuestion()
    return
  }

  currentQuestion.value = q
  userAnswer.value = ''
  showResult.value = false
  isCorrect.value = false
  showImageLightbox.value = false
  startTime.value = Date.now()

  const cat = categoryStore.getCategoryById(q.categoryId)
  currentCategoryName.value = cat?.name || ''

  if (q.imageData) {
    currentImageSrc.value = URL.createObjectURL(q.imageData)
  }

  await nextTick()
  answerInput.value?.focus()
}

function checkAnswer() {
  if (!userAnswer.value.trim() || !currentQuestion.value) return

  const timeSpent = Math.round((Date.now() - startTime.value) / 1000)
  isCorrect.value = userAnswer.value.trim().toLowerCase() === (currentQuestion.value.correctAnswer || '').trim().toLowerCase()
  showResult.value = true

  quizStore.submitAnswer(
    currentQuestion.value.id!,
    userAnswer.value,
    currentQuestion.value.correctAnswer || '',
    timeSpent
  )
}

function revealAnswer() {
  if (!currentQuestion.value) return
  userAnswer.value = currentQuestion.value.correctAnswer || ''
  showResult.value = true
  isCorrect.value = true
}

function nextQuestion() {
  quizStore.nextQuestion()
  if (quizStore.getRemainingCount() <= 0) {
    finishQuiz()
  } else {
    loadCurrentQuestion()
  }
}

async function markMastered() {
  if (!currentQuestion.value?.id) return

  // Find or create the "Mastered" category
  const masteredName = 'Mastered'
  let masteredCat = await db.categories.where('name').equals(masteredName).first()
  if (!masteredCat) {
    const id = await db.categories.add({
      name: masteredName,
      description: '',
      icon: '✅',
      sortOrder: 999,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    masteredCat = await db.categories.get(id)
  }

  // Move question to Mastered category
  await questionStore.updateQuestion(currentQuestion.value.id, {
    categoryId: masteredCat!.id!,
    isMastered: true,
    masteredAt: new Date()
  })

  nextQuestion()
}

async function finishQuiz() {
  const session = await quizStore.completeQuiz()
  correctCount.value = session?.correctCount || 0
  finished.value = true
}

async function abandonQuiz() {
  await quizStore.abandonQuiz()
  router.push('/quiz/setup')
}

function openImageLightbox() {
  showImageLightbox.value = true
}

function closeImageLightbox() {
  showImageLightbox.value = false
}
</script>

<style scoped>
.quiz-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.quiz-progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
}

.quiz-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.quiz-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 560px;
  margin: 0 auto;
}

.quiz-image-container {
  width: 100%;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition);
}

.quiz-image-container:hover {
  box-shadow: var(--shadow-md);
}

.quiz-image {
  width: 100%;
  max-height: 360px;
  object-fit: contain;
}

.quiz-answer-area {
  width: 100%;
}

.answer-input-group {
  margin-bottom: 16px;
}

.answer-input {
  font-size: 16px;
  padding: 12px 16px;
  text-align: center;
  font-weight: 500;
}

.input-correct {
  border-color: var(--color-success) !important;
  background: var(--color-success-light) !important;
}

.input-wrong {
  border-color: var(--color-error) !important;
  background: var(--color-error-light) !important;
}

.quiz-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}

.result-correct {
  background: var(--color-success-light);
  color: var(--color-success);
}

.result-wrong {
  background: var(--color-error-light);
  color: var(--color-error);
}

.result-icon {
  font-size: 24px;
  font-weight: 700;
}

.quiz-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.finished-state {
  text-align: center;
  padding: 60px 20px;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.lightbox-content {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #fff;
  font-size: 32px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-image {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  cursor: default;
}
</style>
