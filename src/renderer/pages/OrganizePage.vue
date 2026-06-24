<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('organize.title') }}</h1>
    </div>

    <div v-if="allQuestions.length === 0" class="empty-state">
      <div class="icon">📷</div>
      <div class="title">{{ $t('organize.noQuestions') }}</div>
      <div class="desc">{{ $t('organize.noQuestionsDesc') }}</div>
      <router-link to="/import" class="btn btn-primary" style="margin-top: 12px">{{ $t('common.goImport') }}</router-link>
    </div>

    <div v-else class="organize-layout">
      <!-- Left: Preview Panel -->
      <div class="organize-preview">
        <div class="preview-header">
          <h3 v-if="selectedCategoryId">
            {{ selectedCategoryName }} ({{ previewQuestions.length }})
          </h3>
          <h3 v-else>{{ $t('organize.allQuestions') }} ({{ allQuestions.length }})</h3>
          <div class="preview-actions">
            <button
              class="btn btn-sm"
              :class="selectMode ? 'btn-primary' : 'btn-secondary'"
              @click="toggleSelectMode"
            >
              {{ selectMode ? $t('organize.exitSelect') : $t('organize.selectDelete') }}
            </button>
            <template v-if="selectMode">
              <button class="btn btn-sm btn-secondary" @click="selectAll">
                {{ $t('organize.selectAll') }} ({{ previewQuestions.length }})
              </button>
              <button class="btn btn-sm btn-secondary" @click="deselectAll">{{ $t('organize.deselectAll') }}</button>
              <button
                class="btn btn-sm btn-danger"
                :disabled="selectedIds.size === 0"
                @click="deleteSelected"
              >
                {{ $t('organize.deleteCount', { count: selectedIds.size }) }}
              </button>
            </template>
          </div>
        </div>

        <div v-if="previewQuestions.length === 0" class="preview-empty">
          {{ $t('organize.noQuestionsInCategory') }}
        </div>
        <div v-else class="preview-grid">
          <div
            v-for="q in previewQuestions"
            :key="q.id"
            class="preview-thumb"
            :class="{ selected: selectedIds.has(q.id!) }"
            draggable="true"
            @dragstart="onDragStart($event, q.id!)"
            @dragend="onDragEnd"
            @click="selectMode ? toggleSelect(q.id!) : openLightbox(q)"
          >
            <div v-if="selectMode" class="checkbox-overlay">
              <span class="checkbox" :class="{ checked: selectedIds.has(q.id!) }">
                {{ selectedIds.has(q.id!) ? '✓' : '' }}
              </span>
            </div>
            <img v-if="imageDataUrls[q.id!]" :src="imageDataUrls[q.id!]" :alt="q.imageName" />
            <div v-else class="img-placeholder">📷</div>
          </div>
        </div>
      </div>

      <!-- Right: Category List -->
      <div class="organize-sidebar">
        <h3 style="margin-bottom: 12px">{{ $t('organize.categories') }}</h3>
        <div class="category-list">
          <!-- All questions option -->
          <div
            class="category-item"
            :class="{
              'drag-over': dragTargetId === -1,
              'selected': selectedCategoryId === null
            }"
            @dragover.prevent="dragTargetId = -1"
            @dragleave="dragTargetId = null"
            @drop="onDrop($event, null)"
            @click="selectCategory(null)"
          >
            <span class="category-name">📋 {{ $t('organize.allQuestions') }}</span>
            <span class="tag">{{ allQuestions.length }}</span>
          </div>

          <!-- Uncategorized -->
          <div
            v-if="uncategorizedCount > 0"
            class="category-item"
            :class="{
              'drag-over': dragTargetId === 0,
              'selected': selectedCategoryId === 0
            }"
            @dragover.prevent="dragTargetId = 0"
            @dragleave="dragTargetId = null"
            @drop="onDrop($event, 0)"
            @click="selectCategory(0)"
          >
            <span class="category-name">📷 {{ $t('common.unclassified') }}</span>
            <span class="tag">{{ uncategorizedCount }}</span>
          </div>

          <!-- Regular categories -->
          <div
            v-for="cat in categoryStore.sortedCategories"
            :key="cat.id"
            class="category-item"
            :class="{
              'drag-over': dragTargetId === cat.id,
              'selected': selectedCategoryId === cat.id
            }"
            @dragover.prevent="dragTargetId = cat.id!"
            @dragleave="dragTargetId = null"
            @drop="onDrop($event, cat.id!)"
            @click="selectCategory(cat.id!)"
          >
            <span class="category-name">{{ cat.icon || '📁' }} {{ cat.name }}</span>
            <span class="tag">{{ categoryCounts[cat.id!] || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div v-if="lightboxQuestion" class="lightbox-overlay" @click.self="closeLightbox">
      <div class="lightbox-content">
        <button class="lightbox-close" @click="closeLightbox">✕</button>
        <img v-if="lightboxImageSrc" :src="lightboxImageSrc" class="lightbox-image" />
        <div class="lightbox-info">
          <span>{{ lightboxQuestion.imageName }}</span>
          <span style="margin-left: 12px; opacity: 0.7">
            📁 {{ getCategoryName(lightboxQuestion.categoryId) }}
          </span>
          <span v-if="lightboxQuestion.correctAnswer" style="margin-left: 12px; opacity: 0.7">
            {{ $t('categoryDetail.correctAnswer') }}: {{ lightboxQuestion.correctAnswer }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from '../stores/categoryStore'
import { useQuestionStore } from '../stores/questionStore'
import { db, type Question } from '../db/database'

const { t } = useI18n()
const categoryStore = useCategoryStore()
const questionStore = useQuestionStore()

const allQuestions = ref<Question[]>([])
const imageDataUrls = ref<Record<number, string>>({})
const categoryCounts = ref<Record<number, number>>({})
const uncategorizedCount = ref(0)
const dragTargetId = ref<number | null>(null)
const selectMode = ref(false)
const selectedIds = ref<Set<number>>(new Set())

// Category selection (null = all, 0 = uncategorized, >0 = category id)
const selectedCategoryId = ref<number | null>(null)
const previewQuestions = ref<Question[]>([])

// Lightbox
const lightboxQuestion = ref<Question | null>(null)
const lightboxImageSrc = ref('')

let draggedQuestionId: number | null = null

const selectedCategoryName = computed(() => {
  if (selectedCategoryId.value === null) return t('organize.allQuestions')
  if (selectedCategoryId.value === 0) return t('common.unclassified')
  const cat = categoryStore.getCategoryById(selectedCategoryId.value)
  return cat?.name || ''
})

onMounted(async () => {
  await categoryStore.loadCategories()
  await loadData()
})

async function loadData() {
  const all = await db.questions.toArray()
  const uncat = await db.categories.where('name').equals(t('common.unclassified')).first()

  // Clean up old blob URLs
  for (const url of Object.values(imageDataUrls.value)) {
    URL.revokeObjectURL(url)
  }
  imageDataUrls.value = {}

  for (const q of all) {
    if (q.id && q.imageData) {
      imageDataUrls.value[q.id] = URL.createObjectURL(q.imageData)
    }
  }

  allQuestions.value = all
  uncategorizedCount.value = uncat ? all.filter(q => q.categoryId === uncat.id).length : 0

  for (const cat of categoryStore.categories) {
    if (cat.id) {
      categoryCounts.value[cat.id] = all.filter(q => q.categoryId === cat.id).length
    }
  }

  // Refresh preview
  await updatePreview()
}

async function selectCategory(catId: number | null) {
  if (selectedCategoryId.value === catId) return
  selectedCategoryId.value = catId
  selectMode.value = false
  selectedIds.value.clear()
  await updatePreview()
}

async function updatePreview() {
  const uncat = await db.categories.where('name').equals(t('common.unclassified')).first()
  const uncatId = uncat?.id || 0

  if (selectedCategoryId.value === null) {
    // All questions
    previewQuestions.value = allQuestions.value
  } else if (selectedCategoryId.value === 0) {
    // Uncategorized
    previewQuestions.value = allQuestions.value.filter(q => q.categoryId === uncatId)
  } else {
    // Specific category
    previewQuestions.value = allQuestions.value.filter(q => q.categoryId === selectedCategoryId.value)
  }
}

function onDragStart(e: DragEvent, questionId: number) {
  draggedQuestionId = questionId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(questionId))
  }
  const target = e.target as HTMLElement
  target.style.opacity = '0.5'
}

function onDragEnd(e: DragEvent) {
  const target = e.target as HTMLElement
  target.style.opacity = '1'
  draggedQuestionId = null
  dragTargetId.value = null
}

async function onDrop(e: DragEvent, categoryId: number | null) {
  e.preventDefault()
  dragTargetId.value = null
  if (draggedQuestionId === null) return

  let targetCategoryId = categoryId
  if (categoryId === 0) {
    const uncat = await db.categories.where('name').equals(t('common.unclassified')).first()
    targetCategoryId = uncat?.id || 0
  }

  const masteredCat = categoryStore.categories.find(c => c.name === 'Mastered')
  const updates: Partial<Question> = { categoryId: targetCategoryId! }

  if (masteredCat && targetCategoryId !== masteredCat.id) {
    updates.isMastered = false
    updates.masteredAt = null
  }

  await questionStore.updateQuestion(draggedQuestionId, updates)
  draggedQuestionId = null
  await loadData()
}

// Select mode
function toggleSelectMode() {
  selectMode.value = !selectMode.value
  if (!selectMode.value) selectedIds.value.clear()
}

function toggleSelect(id: number) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function selectAll() {
  for (const q of previewQuestions.value) {
    if (q.id) selectedIds.value.add(q.id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function deselectAll() {
  selectedIds.value.clear()
  selectedIds.value = new Set()
}

async function deleteSelected() {
  if (selectedIds.value.size === 0) return
  const count = selectedIds.value.size
  if (!confirm(t('organize.deleteConfirm', { count }))) return

  for (const id of selectedIds.value) {
    await questionStore.deleteQuestion(id)
  }
  selectedIds.value.clear()
  selectedIds.value = new Set()
  selectMode.value = false
  await loadData()
}

function openLightbox(q: Question) {
  lightboxQuestion.value = q
  lightboxImageSrc.value = q.id ? imageDataUrls.value[q.id] || '' : ''
}

function getCategoryName(categoryId: number): string {
  const cat = categoryStore.getCategoryById(categoryId)
  return cat?.name || t('common.unclassified')
}

function closeLightbox() {
  lightboxQuestion.value = null
  lightboxImageSrc.value = ''
}
</script>

<style scoped>
.organize-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  min-height: 60vh;
}

/* Left: Preview Panel */
.organize-preview {
  background: var(--color-card);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--color-border);
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-header h3 {
  font-size: 16px;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-danger {
  background: var(--color-error, #ef4444);
  color: white;
  border: none;
}

.btn-danger:hover {
  opacity: 0.9;
}

.btn-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.preview-empty {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.preview-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid var(--color-border);
  transition: all var(--transition);
}

.preview-thumb:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.preview-thumb.selected {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  font-size: 24px;
}

.checkbox-overlay {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid var(--color-border);
  background: var(--color-card);
  font-size: 12px;
  font-weight: 700;
  color: white;
  transition: all var(--transition);
}

.checkbox.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

/* Right: Category List */
.organize-sidebar {
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--color-card);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition);
  font-size: 14px;
  cursor: pointer;
}

.category-item:hover {
  border-color: var(--color-primary);
}

.category-item.selected {
  border-color: var(--color-primary);
  border-style: solid;
  background: var(--color-primary-light);
}

.category-item.drag-over {
  border-color: var(--color-primary);
  border-style: solid;
  background: var(--color-primary-light);
  transform: scale(1.02);
}

.category-name {
  font-weight: 500;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.lightbox-info {
  margin-top: 12px;
  color: white;
  font-size: 14px;
  text-align: center;
}
</style>
