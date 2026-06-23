import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type QuizSession, type QuizAnswer } from '../db/database'
import { useQuestionStore } from './questionStore'

export interface QuizConfig {
  categoryIds: number[]
  includeMastered: boolean
  shuffle: boolean
}

export const useQuizStore = defineStore('quiz', () => {
  const questionStore = useQuestionStore()

  const currentSession = ref<QuizSession | null>(null)
  const currentQuestionIndex = ref(0)
  const quizQuestions = ref<number[]>([])
  const quizAnswers = ref<Map<number, string>>(new Map())
  const sessionHistory = ref<QuizSession[]>([])

  async function startQuiz(config: QuizConfig) {
    const allQuestions = await db.questions.toArray()
    let filtered = allQuestions.filter(q => {
      if (!config.categoryIds.includes(q.categoryId)) return false
      if (!config.includeMastered && q.isMastered) return false
      return true
    })

    let questionIds = filtered.map(q => q.id!)
    if (config.shuffle) {
      for (let i = questionIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionIds[i], questionIds[j]] = [questionIds[j], questionIds[i]]
      }
    }

    const sessionId = await db.quizSessions.add({
      startedAt: new Date(),
      completedAt: null,
      finishedCount: 0,
      totalCount: questionIds.length,
      correctCount: 0,
      isAbandoned: false
    })

    const session = await db.quizSessions.get(sessionId)
    currentSession.value = session!
    quizQuestions.value = questionIds
    currentQuestionIndex.value = 0
    quizAnswers.value = new Map()

    return session
  }

  async function submitAnswer(questionId: number, userAnswer: string, correctAnswer: string, timeSpent: number) {
    if (!currentSession.value?.id) return

    const isCorrect = userAnswer.trim() === correctAnswer.trim()

    await db.quizAnswers.add({
      sessionId: currentSession.value.id,
      questionId,
      userAnswer,
      isCorrect,
      answeredAt: new Date(),
      timeSpent
    })

    quizAnswers.value.set(questionId, userAnswer)

    if (!isCorrect) {
      await questionStore.incrementWrongCount(questionId)
    }
  }

  function nextQuestion() {
    currentQuestionIndex.value++
  }

  function getCurrentQuestionId() {
    return quizQuestions.value[currentQuestionIndex.value] ?? null
  }

  function getRemainingCount() {
    return quizQuestions.value.length - currentQuestionIndex.value
  }

  async function completeQuiz() {
    if (!currentSession.value?.id) return

    const answers = await db.quizAnswers.where('sessionId').equals(currentSession.value.id).toArray()
    const correctCount = answers.filter(a => a.isCorrect).length

    await db.quizSessions.update(currentSession.value.id, {
      completedAt: new Date(),
      finishedCount: answers.length,
      correctCount
    })

    const updated = await db.quizSessions.get(currentSession.value.id)
    currentSession.value = updated
    return updated
  }

  async function abandonQuiz() {
    if (!currentSession.value?.id) return
    await db.quizSessions.update(currentSession.value.id, { isAbandoned: true })
    currentSession.value = null
    quizQuestions.value = []
    currentQuestionIndex.value = 0
    quizAnswers.value = new Map()
  }

  async function loadSessionHistory() {
    sessionHistory.value = await db.quizSessions.orderBy('startedAt').reverse().toArray()
  }

  async function getSessionAnswers(sessionId: number): Promise<QuizAnswer[]> {
    return await db.quizAnswers.where('sessionId').equals(sessionId).toArray()
  }

  return {
    currentSession,
    currentQuestionIndex,
    quizQuestions,
    quizAnswers,
    sessionHistory,
    startQuiz,
    submitAnswer,
    nextQuestion,
    getCurrentQuestionId,
    getRemainingCount,
    completeQuiz,
    abandonQuiz,
    loadSessionHistory,
    getSessionAnswers
  }
})
