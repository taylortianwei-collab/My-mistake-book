<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('quiz.result.title') }}</h1>
    </div>

    <div v-if="!session" class="empty-state">
      <div class="icon">📊</div>
      <div class="title">{{ $t('quiz.result.noResults') }}</div>
      <router-link to="/quiz/setup" class="btn btn-primary" style="margin-top: 12px">{{ $t('quiz.result.startQuiz') }}</router-link>
    </div>

    <div v-else>
      <div class="result-card card">
        <div class="result-stats">
          <div class="result-stat">
            <div class="result-stat-number">{{ session.totalCount }}</div>
            <div class="result-stat-label">{{ $t('quiz.result.totalQuestions') }}</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-number correct">{{ session.correctCount }}</div>
            <div class="result-stat-label">{{ $t('quiz.result.correct') }}</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-number wrong">{{ session.totalCount - session.correctCount }}</div>
            <div class="result-stat-label">{{ $t('quiz.result.wrong') }}</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-number">{{ accuracy }}%</div>
            <div class="result-stat-label">{{ $t('quiz.result.accuracy') }}</div>
          </div>
        </div>

        <div class="accuracy-bar">
          <div class="accuracy-fill" :style="{ width: accuracy + '%', background: accuracy >= 80 ? 'var(--color-success)' : accuracy >= 50 ? 'var(--color-warning)' : 'var(--color-error)' }"></div>
        </div>
      </div>

      <div v-if="answers.length > 0" class="card" style="margin-top: 20px">
        <h3 style="margin-bottom: 14px">{{ $t('quiz.result.answerDetails') }}</h3>
        <div v-for="(ans, i) in answers" :key="ans.id" class="answer-row" :class="ans.isCorrect ? 'correct' : 'wrong'">
          <span class="answer-index">{{ i + 1 }}</span>
          <span class="answer-result-icon">{{ ans.isCorrect ? '✓' : '✗' }}</span>
          <span class="answer-detail">
            {{ $t('quiz.result.myAnswer') }}：<strong>{{ ans.userAnswer || $t('quiz.result.notFilled') }}</strong>
          </span>
          <span class="answer-time">{{ ans.timeSpent }}s</span>
        </div>
      </div>

      <div style="margin-top: 20px; display: flex; gap: 8px">
        <router-link to="/quiz/setup" class="btn btn-primary">{{ $t('quiz.result.tryAgain') }}</router-link>
        <router-link to="/dashboard" class="btn btn-secondary">{{ $t('quiz.result.backToHome') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '../stores/quizStore'
import { db, type QuizAnswer } from '../db/database'

const { t } = useI18n()
const quizStore = useQuizStore()

const session = ref<any>(null)
const answers = ref<QuizAnswer[]>([])

const accuracy = computed(() => {
  if (!session.value || session.value.totalCount === 0) return 0
  return Math.round((session.value.correctCount / session.value.totalCount) * 100)
})

onMounted(async () => {
  session.value = quizStore.currentSession
  if (session.value?.id) {
    answers.value = await quizStore.getSessionAnswers(session.value.id)
  }
  await quizStore.loadSessionHistory()
})
</script>

<style scoped>
.result-card {
  max-width: 600px;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  text-align: center;
  margin-bottom: 16px;
}

.result-stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.result-stat-number.correct {
  color: var(--color-success);
}

.result-stat-number.wrong {
  color: var(--color-error);
}

.result-stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.accuracy-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
}

.accuracy-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.answer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  font-size: 13px;
}

.answer-row.correct {
  background: var(--color-success-light);
}

.answer-row.wrong {
  background: var(--color-error-light);
}

.answer-index {
  font-weight: 600;
  color: var(--color-text-muted);
  width: 24px;
  text-align: right;
}

.answer-result-icon {
  font-size: 14px;
  font-weight: 700;
}

.answer-detail {
  flex: 1;
}

.answer-time {
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>
