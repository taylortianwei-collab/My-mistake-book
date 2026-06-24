<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('categories.title') }}</h1>
      <button class="btn btn-primary" @click="openAddModal">{{ $t('categories.newCategory') }}</button>
    </div>

    <div v-if="categoryStore.loading" class="empty-state">
      <div class="spinner"></div>
      <p style="margin-top: 12px">{{ $t('common.loading') }}</p>
    </div>

    <div v-else-if="categoryStore.sortedCategories.length === 0" class="empty-state">
      <div class="icon">📁</div>
      <div class="title">{{ $t('categories.noCategories') }}</div>
      <div class="desc">{{ $t('categories.noCategoriesDesc') }}</div>
      <router-link to="/import" class="btn btn-primary" style="margin-top: 12px">{{ $t('common.goImport') }}</router-link>
    </div>

    <div v-else class="categories-list">
      <div
        v-for="cat in categoryStore.sortedCategories"
        :key="cat.id"
        class="category-item"
      >
        <router-link :to="`/categories/${cat.id}`" class="category-item-link">
          <span class="category-icon">{{ cat.icon || '📁' }}</span>
          <div class="category-info">
            <div class="category-name">{{ getCategoryDisplayName(cat.name) }}</div>
            <div class="category-meta">{{ categoryCounts[cat.id!] || 0 }} {{ $t('categories.questions') }}</div>
          </div>
        </router-link>
        <div class="category-actions">
          <button class="btn-icon" @click.prevent="openEditModal(cat)" :title="$t('categories.edit')">✏️</button>
          <button class="btn-icon" @click.prevent="confirmDelete(cat)" :title="$t('common.delete')">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-title">{{ $t('categories.newCategoryTitle') }}</div>
        <input v-model="newCategoryName" class="input" :placeholder="$t('categories.categoryName')" ref="addInput" @keyup.enter="addCategory" />
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="addCategory" :disabled="!newCategoryName.trim()">{{ $t('common.confirm') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-title">{{ $t('categories.editCategoryTitle') }}</div>
        <input v-model="editCategoryName" class="input" :placeholder="$t('categories.categoryName')" @keyup.enter="saveEdit" />
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showEditModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveEdit" :disabled="!editCategoryName.trim()">{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-title">{{ $t('categories.deleteTitle') }}</div>
        <p>{{ $t('categories.deleteConfirm', { name: getCategoryDisplayName(deletingCategory?.name || '') }) }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-danger" @click="deleteCategory">{{ $t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from '../stores/categoryStore'
import { db, type Category } from '../db/database'

const { t } = useI18n()
const categoryStore = useCategoryStore()
const categoryCounts = ref<Record<number, number>>({})

const showAddModal = ref(false)
const newCategoryName = ref('')
const addInput = ref<HTMLInputElement | null>(null)
const showEditModal = ref(false)
const editCategoryName = ref('')
const editingCategory = ref<Category | null>(null)
const showDeleteModal = ref(false)
const deletingCategory = ref<Category | null>(null)

onMounted(async () => {
  await categoryStore.loadCategories()
  await loadCounts()
})

async function loadCounts() {
  for (const cat of categoryStore.categories) {
    if (cat.id) {
      categoryCounts.value[cat.id] = await db.questions.where('categoryId').equals(cat.id).count()
    }
  }
}

function getCategoryDisplayName(name: string): string {
  if (name === 'Uncategorized') return t('common.unclassified')
  if (name === 'Mastered') return t('mastered.title')
  return name
}

function openAddModal() {
  newCategoryName.value = ''
  showAddModal.value = true
  nextTick(() => addInput.value?.focus())
}

async function addCategory() {
  if (!newCategoryName.value.trim()) return
  await categoryStore.addCategory(newCategoryName.value.trim())
  newCategoryName.value = ''
  showAddModal.value = false
  await loadCounts()
}

function openEditModal(cat: Category) {
  editingCategory.value = cat
  editCategoryName.value = cat.name
  showEditModal.value = true
}

async function saveEdit() {
  if (!editCategoryName.value.trim() || !editingCategory.value?.id) return
  await categoryStore.updateCategory(editingCategory.value.id, { name: editCategoryName.value.trim() })
  showEditModal.value = false
}

function confirmDelete(cat: Category) {
  deletingCategory.value = cat
  showDeleteModal.value = true
}

async function deleteCategory() {
  if (!deletingCategory.value?.id) return
  await categoryStore.deleteCategory(deletingCategory.value.id)
  showDeleteModal.value = false
  await loadCounts()
}
</script>

<style scoped>
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  transition: all var(--transition);
}

.category-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.category-item-link {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  color: inherit;
  text-decoration: none;
}

.category-icon {
  font-size: 24px;
}

.category-name {
  font-weight: 600;
  font-size: 15px;
}

.category-meta {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.category-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: background var(--transition);
}

.btn-icon:hover {
  background: var(--color-bg);
}
</style>
