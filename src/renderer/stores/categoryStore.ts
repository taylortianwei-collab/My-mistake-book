import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, type Category } from '../db/database'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder)
  })

  async function loadCategories() {
    loading.value = true
    try {
      categories.value = await db.categories.toArray()
    } finally {
      loading.value = false
    }
  }

  async function initializeDefaultCategories(unclassifiedName: string, masteredName: string) {
    const existingUncat = await db.categories.where('name').equals(unclassifiedName).first()
    if (!existingUncat) {
      await db.categories.add({
        name: unclassifiedName,
        description: '',
        icon: '📷',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    const existingMastered = await db.categories.where('name').equals(masteredName).first()
    if (!existingMastered) {
      await db.categories.add({
        name: masteredName,
        description: '',
        icon: '✅',
        sortOrder: 999,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    await loadCategories()
    await cleanupFilenames()
  }

  async function cleanupFilenames() {
    const allQuestions = await db.questions.toArray()
    for (const q of allQuestions) {
      if (q.imageName && (q.imageName.includes('✓') || q.imageName.includes('✅'))) {
        const cleanedName = q.imageName.replace(/[✓✅]/g, '').trim()
        await db.questions.update(q.id!, { imageName: cleanedName })
      }
    }
  }

  async function addCategory(name: string, description = '', icon = ''): Promise<number> {
    const existing = await db.categories.where('name').equals(name).first()
    if (existing) return existing.id!

    const maxOrder = await db.categories.orderBy('sortOrder').last()
    const id = await db.categories.add({
      name,
      description,
      icon,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await loadCategories()
    return id as number
  }

  async function updateCategory(id: number, updates: Partial<Category>) {
    await db.categories.update(id, { ...updates, updatedAt: new Date() })
    await loadCategories()
  }

  async function deleteCategory(id: number) {
    const questions = await db.questions.where('categoryId').equals(id).toArray()
    for (const q of questions) {
      if (q.id) await db.questions.delete(q.id)
    }
    await db.categories.delete(id)
    await loadCategories()
  }

  function getCategoryById(id: number) {
    return categories.value.find(c => c.id === id)
  }

  return {
    categories,
    loading,
    sortedCategories,
    loadCategories,
    initializeDefaultCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
  }
})
