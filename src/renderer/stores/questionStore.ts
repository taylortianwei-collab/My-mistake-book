import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type Question } from '../db/database'

export const useQuestionStore = defineStore('question', () => {
  const questions = ref<Question[]>([])
  const loading = ref(false)

  async function loadQuestions() {
    loading.value = true
    try {
      questions.value = await db.questions.toArray()
    } finally {
      loading.value = false
    }
  }

  async function loadQuestionsByCategory(categoryId: number) {
    return await db.questions.where('categoryId').equals(categoryId).toArray()
  }

  async function addQuestion(data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const existing = await db.questions
      .where('imageName')
      .equals(data.imageName)
      .filter(q => q.categoryId === data.categoryId)
      .first()

    if (existing) return existing.id!

    const id = await db.questions.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await loadQuestions()
    return id as number
  }

  async function updateQuestion(id: number, updates: Partial<Question>) {
    await db.questions.update(id, { ...updates, updatedAt: new Date() })
    await loadQuestions()
  }

  async function markMastered(id: number) {
    await db.questions.update(id, {
      isMastered: true,
      masteredAt: new Date(),
      updatedAt: new Date()
    })
    await loadQuestions()
  }

  async function unmarkMastered(id: number) {
    await db.questions.update(id, {
      isMastered: false,
      masteredAt: null,
      updatedAt: new Date()
    })
    await loadQuestions()
  }

  async function deleteQuestion(id: number) {
    await db.questions.delete(id)
    await loadQuestions()
  }

  async function incrementWrongCount(id: number) {
    const q = await db.questions.get(id)
    if (q) {
      await db.questions.update(id, {
        wrongCount: (q.wrongCount || 0) + 1,
        updatedAt: new Date()
      })
    }
  }

  function getQuestionById(id: number) {
    return questions.value.find(q => q.id === id)
  }

  return {
    questions,
    loading,
    loadQuestions,
    loadQuestionsByCategory,
    addQuestion,
    updateQuestion,
    markMastered,
    unmarkMastered,
    deleteQuestion,
    incrementWrongCount,
    getQuestionById
  }
})
