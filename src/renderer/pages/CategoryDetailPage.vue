<template>
  <div>
    <div class="page-header">
      <div>
        <router-link to="/categories" style="color: var(--color-text-muted); font-size: 13px; text-decoration: none">{{ $t('categoryDetail.backToCategories') }}</router-link>
        <h1 class="page-title" style="margin-top: 4px">{{ categoryName }}</h1>
      </div>
    </div>

    <div v-if="questions.length === 0" class="empty-state">
      <div class="icon">📷</div>
      <div class="title">{{ $t('categoryDetail.noQuestions') }}</div>
      <div class="desc">{{ $t('categoryDetail.noQuestionsDesc') }}</div>
      <router-link to="/import" class="btn btn-primary" style="margin-top: 12px">{{ $t('common.goImport') }}</router-link>
    </div>

    <template v-else>
      <div class="toolbar">
        <button
          class="btn btn-sm"
          :class="selectMode ? 'btn-primary' : 'btn-secondary'"
          @click="toggleSelectMode"
        >
          {{ selectMode ? $t('categoryDetail.exitSelect') : $t('categoryDetail.selectDelete') }}
        </button>
        <template v-if="selectMode">
          <button class="btn btn-sm btn-secondary" @click="selectAll">
            {{ $t('categoryDetail.selectAll') }} ({{ questions.length }})
          </button>
          <button class="btn btn-sm btn-secondary" @click="deselectAll">{{ $t('categoryDetail.deselectAll') }}</button>
          <button
            class="btn btn-sm btn-danger"
            :disabled="selectedIds.size === 0"
            @click="deleteSelected"
          >
            {{ $t('categoryDetail.deleteCount', { count: selectedIds.size }) }}
          </button>
        </template>
      </div>

      <div class="grid-images">
        <div
          v-for="q in questions"
          :key="q.id"
          class="image-card"
          :class="{ selected: selectedIds.has(q.id!) }"
          @click="selectMode ? toggleSelect(q.id!) : openQuestion(q)"
        >
          <div v-if="selectMode" class="checkbox-overlay">
            <span class="checkbox" :class="{ checked: selectedIds.has(q.id!) }">
              {{ selectedIds.has(q.id!) ? '✓' : '' }}
            </span>
          </div>
          <img v-if="imageDataUrls[q.id!]" :src="imageDataUrls[q.id!]" :alt="q.imageName" />
          <div v-else class="image-placeholder">📷</div>
          <div class="image-card-info">
            <span>{{ q.imageName }}</span>
            <span v-if="q.isMastered" class="tag" style="margin-left: 6px">✅</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal" style="max-width: 560px">
        <div class="modal-title">{{ $t('categoryDetail.editQuestion') }}</div>
        <div v-if="editingQuestion">
          <img v-if="editingImageSrc" :src="editingImageSrc" class="edit-preview" />
          <div class="form-group">
            <label class="form-label">{{ $t('categoryDetail.correctAnswer') }}</label>
            <input v-model="editingAnswer" class="input" :placeholder="$t('categoryDetail.correctAnswerPlaceholder')" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('categoryDetail.notes') }}</label>
            <textarea v-model="editingNotes" class="input" rows="3" :placeholder="$t('categoryDetail.notesPlaceholder')"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showEditModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveEdit">{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from '../stores/categoryStore'
import { useQuestionStore } from '../stores/questionStore'
import { db, type Question } from '../db/database'

const route = useRoute()
const { t } = useI18n()
const categoryStore = useCategoryStore()
const questionStore = useQuestionStore()

const categoryId = Number(route.params.id)
const categoryName = ref('')
const questions = ref<Question[]>([])
const imageDataUrls = ref<Record<number, string>>({})

const showEditModal = ref(false)
const editingQuestion = ref<Question | null>(null)
const editingAnswer = ref('')
const editingNotes = ref('')
const editingImageSrc = ref('')

// Select/delete
const selectMode = ref(false)
const selectedIds = ref<Set<number>>(new Set())

onMounted(async () => {
  await categoryStore.loadCategories()
  const cat = categoryStore.getCategoryById(categoryId)
  categoryName.value = cat?.name === 'Uncategorized' ? t('common.unclassified') : cat?.name === 'Mastered' ? t('mastered.title') : cat?.name || t('categoryDetail.unknownCategory')
  await loadQuestions()
})

async function loadQuestions() {
  questions.value = await questionStore.loadQuestionsByCategory(categoryId)
  for (const q of questions.value) {
    if (q.id && q.imageData) {
      imageDataUrls.value[q.id] = URL.createObjectURL(q.imageData)
    }
  }
}

function openQuestion(q: Question) {
  editingQuestion.value = q
  editingAnswer.value = q.correctAnswer
  editingNotes.value = q.notes
  editingImageSrc.value = q.id ? imageDataUrls.value[q.id] || '' : ''
  showEditModal.value = true
}

async function saveEdit() {
  if (!editingQuestion.value?.id) return
  await questionStore.updateQuestion(editingQuestion.value.id, {
    correctAnswer: editingAnswer.value,
    notes: editingNotes.value
  })
  const q = questions.value.find(x => x.id === editingQuestion.value!.id)
  if (q) {
    q.correctAnswer = editingAnswer.value
    q.notes = editingNotes.value
  }
  showEditModal.value = false
}

// Select/delete methods
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
  for (const q of questions.value) {
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
  if (!confirm(t('categoryDetail.deleteConfirm', { count }))) return

  for (const id of selectedIds.value) {
    await questionStore.deleteQuestion(id)
  }
  selectedIds.value.clear()
  selectedIds.value = new Set()
  selectMode.value = false
  await loadQuestions()
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
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

.image-card {
  position: relative;
  cursor: pointer;
}

.image-card.selected {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

.checkbox-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 2px solid var(--color-border);
  background: var(--color-card);
  font-size: 13px;
  font-weight: 700;
  color: white;
  transition: all var(--transition);
}

.checkbox.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.image-placeholder {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  font-size: 32px;
}

.edit-preview {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  margin-bottom: 16px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
