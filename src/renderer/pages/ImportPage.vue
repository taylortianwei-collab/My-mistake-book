<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('import.title') }}</h1>
    </div>

    <div class="import-options import-options-3">
      <div class="drop-zone" @click="selectFolder">
        <div class="icon">📁</div>
        <div class="title">{{ $t('import.fromFolder') }}</div>
        <div class="desc">{{ $t('import.fromFolderDesc') }}</div>
        <button class="btn btn-primary" style="margin-top: 12px">{{ $t('import.selectFolder') }}</button>
      </div>

      <div class="drop-zone" @click="selectImages">
        <div class="icon">🖼️</div>
        <div class="title">{{ $t('import.selectImages') }}</div>
        <div class="desc">{{ $t('import.selectImagesDesc') }}</div>
        <button class="btn btn-primary" style="margin-top: 12px">{{ $t('import.selectImagesBtn') }}</button>
      </div>

      <div
        class="drop-zone paste-zone"
        :class="{ 'paste-active': pasteActive }"
        @click="focusPasteZone"
        @paste.prevent="onPaste"
        tabindex="0"
        ref="pasteZoneRef"
      >
        <div class="icon">📋</div>
        <div class="title">{{ $t('import.pasteScreenshot') }}</div>
        <div class="desc">{{ $t('import.pasteDesc') }}</div>
        <div v-if="pasteActive" class="paste-hint">{{ $t('import.pasteHint') }}</div>
        <button v-else class="btn btn-primary" style="margin-top: 12px">{{ $t('import.pasteActivate') }}</button>
      </div>
    </div>

    <div v-if="scanning" class="card" style="margin-top: 24px; text-align: center; padding: 40px">
      <div class="spinner"></div>
      <p style="margin-top: 12px; color: var(--color-text-secondary)">{{ $t('import.scanning') }}</p>
    </div>

    <div v-if="scanResult" class="card" style="margin-top: 24px">
      <h3 style="margin-bottom: 16px">{{ $t('import.scanResult') }}</h3>
      <p style="margin-bottom: 16px; color: var(--color-text-secondary)">
        {{ $t('common.unclassified') }} <strong style="color: var(--color-primary)">{{ scanResult.categories.length }}</strong> {{ $t('import.foundCategories') }}，
        <strong style="color: var(--color-primary)">{{ totalImages }}</strong> {{ $t('import.foundImages') }}
      </p>

      <div v-for="cat in scanResult.categories" :key="cat.name" class="scan-category">
        <div class="scan-category-header">
          <span>📁 {{ cat.name }}</span>
          <div class="scan-category-actions">
            <select
              v-if="cat.name === $t('import.pasteScreenshot')"
              v-model="pasteCategoryId"
              class="input category-select"
            >
              <option :value="0">{{ $t('import.newCategory') }}</option>
              <option v-for="c in categoryStore.sortedCategories" :key="c.id" :value="c.id">
                {{ c.icon || '📁' }} {{ c.name }}
              </option>
            </select>
            <select
              v-else-if="isImageSelection"
              v-model="imageCategoryId"
              class="input category-select"
            >
              <option :value="0">{{ $t('import.newCategory') }}</option>
              <option v-for="c in categoryStore.sortedCategories" :key="c.id" :value="c.id">
                {{ c.icon || '📁' }} {{ c.name }}
              </option>
            </select>
            <span class="tag">{{ cat.images.length }} {{ $t('import.images') }}</span>
          </div>
        </div>
        <div v-if="cat.name === $t('import.pasteScreenshot') && pasteCategoryId === 0" class="paste-category-input">
          <input
            v-model="pasteNewCategoryName"
            class="input"
            :placeholder="$t('categories.categoryName')"
            style="max-width: 200px"
          />
        </div>
        <div v-if="isImageSelection && imageCategoryId === 0" class="paste-category-input">
          <input
            v-model="imageNewCategoryName"
            class="input"
            :placeholder="$t('categories.categoryName')"
            style="max-width: 200px"
          />
        </div>
        <div class="scan-thumbs">
          <div v-for="(img, idx) in cat.images.slice(0, 8)" :key="img.filePath" class="scan-thumb" @click="openLightbox(img)">
            <img v-if="thumbnails[img.filePath]" :src="thumbnails[img.filePath]" />
            <div v-else class="scan-thumb-placeholder">📷</div>
          </div>
          <div v-if="cat.images.length > 8" class="scan-thumb-more">
            +{{ cat.images.length - 8 }}
          </div>
        </div>
      </div>

      <div v-if="scanResult.uncategorized.length > 0" class="scan-category">
        <div class="scan-category-header">
          <span>📷 {{ $t('common.unclassified') }}</span>
          <span class="tag">{{ scanResult.uncategorized.length }} {{ $t('import.images') }}</span>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border)">
        <div class="answer-notes-section">
          <div class="form-group">
            <label class="form-label">{{ $t('import.correctAnswer') }}</label>
            <input v-model="batchAnswer" class="input" :placeholder="$t('import.correctAnswerPlaceholder')" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('import.notes') }}</label>
            <textarea v-model="batchNotes" class="input" rows="2" :placeholder="$t('import.notesPlaceholder')"></textarea>
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; display: flex; gap: 8px">
        <button class="btn btn-primary" @click="confirmImport" :disabled="importing">
          {{ importing ? $t('import.importing') : `${$t('import.confirmImport')} (${totalImages})` }}
        </button>
        <button class="btn btn-secondary" @click="cancelImport">{{ $t('common.cancel') }}</button>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxImage" class="lightbox-overlay" @click.self="closeLightbox">
        <div class="lightbox-content">
          <button class="lightbox-close" @click="closeLightbox">&times;</button>
          <img :src="lightboxImage" class="lightbox-img" />
          <div class="lightbox-filename">{{ lightboxFileName }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCategoryStore } from '../stores/categoryStore'
import { useQuestionStore } from '../stores/questionStore'

const router = useRouter()
const { t } = useI18n()
const categoryStore = useCategoryStore()
const questionStore = useQuestionStore()

interface ImageInfo {
  fileName: string
  filePath: string
  size: number
}

interface ScanResult {
  categories: Array<{ name: string; images: ImageInfo[] }>
  uncategorized: ImageInfo[]
}

const scanning = ref(false)
const scanResult = ref<ScanResult | null>(null)
const importing = ref(false)
const thumbnails = ref<Record<string, string>>({})
const pasteActive = ref(false)
const pasteZoneRef = ref<HTMLElement | null>(null)
const pasteCategoryId = ref(0)
const pasteNewCategoryName = ref('')
const imageCategoryId = ref(0)
const imageNewCategoryName = ref('')
const isImageSelection = ref(false)
const batchAnswer = ref('')
const batchNotes = ref('')
const lightboxImage = ref<string | null>(null)
const lightboxFileName = ref('')
let pasteCounter = 0

const totalImages = computed(() => {
  if (!scanResult.value) return 0
  return scanResult.value.categories.reduce((sum, c) => sum + c.images.length, 0) + scanResult.value.uncategorized.length
})

async function selectFolder() {
  const folder = await window.api.selectFolder()
  if (!folder) return
  scanning.value = true
  thumbnails.value = {}
  try {
    scanResult.value = await window.api.scanFolder(folder)
    loadThumbnails()
  } finally {
    scanning.value = false
  }
}

async function selectImages() {
  const files = await window.api.selectImages()
  if (!files || files.length === 0) return
  thumbnails.value = {}
  isImageSelection.value = true
  scanResult.value = {
    categories: [{
      name: 'Uncategorized',
      images: files.map(f => ({
        fileName: f.split('/').pop() || f.split('\\').pop() || '',
        filePath: f,
        size: 0
      }))
    }],
    uncategorized: []
  }
  loadThumbnails()
}

async function loadThumbnails() {
  if (!scanResult.value) return
  const allImages = [
    ...scanResult.value.categories.flatMap(c => c.images),
    ...scanResult.value.uncategorized
  ]
  for (const img of allImages.slice(0, 20)) {
    if (img.filePath.startsWith('blob:')) {
      thumbnails.value[img.filePath] = img.filePath
    } else {
      const dataUrl = await window.api.readImageAsDataURL(img.filePath)
      if (dataUrl) {
        thumbnails.value[img.filePath] = dataUrl
      }
    }
  }
}

function focusPasteZone() {
  pasteActive.value = true
  pasteZoneRef.value?.focus()
}

async function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (!blob) continue

      pasteCounter++
      const fileName = `${t('import.pasteFileName')}_${pasteCounter}.png`
      const dataUrl = URL.createObjectURL(blob)

      if (!scanResult.value) {
        scanResult.value = { categories: [{ name: t('import.pasteScreenshot'), images: [] }], uncategorized: [] }
      }

      const imgInfo = { fileName, filePath: dataUrl, size: blob.size }
      scanResult.value.categories[0].images.push(imgInfo)
      thumbnails.value[dataUrl] = dataUrl
    }
  }
}

onMounted(async () => {
  document.addEventListener('paste', onPaste as any)
  document.addEventListener('keydown', onKeydown)
  await categoryStore.loadCategories()
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste as any)
  document.removeEventListener('keydown', onKeydown)
})

function cancelImport() {
  if (scanResult.value) {
    for (const cat of scanResult.value.categories) {
      for (const img of cat.images) {
        if (img.filePath.startsWith('blob:')) URL.revokeObjectURL(img.filePath)
      }
    }
  }
  scanResult.value = null
  thumbnails.value = {}
  isImageSelection.value = false
  closeLightbox()
}

function openLightbox(img: ImageInfo) {
  lightboxImage.value = thumbnails.value[img.filePath] || null
  lightboxFileName.value = img.fileName
}

function closeLightbox() {
  lightboxImage.value = null
  lightboxFileName.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && lightboxImage.value) {
    closeLightbox()
  }
}

async function confirmImport() {
  if (!scanResult.value) return
  importing.value = true
  try {
    await categoryStore.loadCategories()

    for (const cat of scanResult.value.categories) {
      let categoryId: number
      if (cat.name === t('import.pasteScreenshot')) {
        if (pasteCategoryId.value === 0) {
          const newName = pasteNewCategoryName.value.trim() || t('import.pasteScreenshot')
          categoryId = await categoryStore.addCategory(newName)
        } else {
          categoryId = pasteCategoryId.value
        }
      } else if (isImageSelection.value) {
        if (imageCategoryId.value === 0) {
          const newName = imageNewCategoryName.value.trim() || 'Uncategorized'
          categoryId = await categoryStore.addCategory(newName)
        } else {
          categoryId = imageCategoryId.value
        }
      } else {
        categoryId = await categoryStore.addCategory(cat.name)
      }

      for (const img of cat.images) {
        let blob: Blob
        if (img.filePath.startsWith('blob:')) {
          const resp = await fetch(img.filePath)
          blob = await resp.blob()
        } else {
          const dataUrl = await window.api.readImageAsDataURL(img.filePath)
          if (!dataUrl) continue
          blob = dataURLtoBlob(dataUrl)
        }
        await questionStore.addQuestion({
          categoryId,
          imageData: blob,
          imageName: img.fileName,
          imageSize: img.size,
          imageType: blob.type,
          correctAnswer: batchAnswer.value,
          myAnswer: '',
          notes: batchNotes.value,
          isMastered: false,
          masteredAt: null,
          wrongCount: 0
        })
      }
    }

    for (const img of scanResult.value.uncategorized) {
      const uncategorizedId = await categoryStore.addCategory('Uncategorized')
      let blob: Blob
      if (img.filePath.startsWith('blob:')) {
        const resp = await fetch(img.filePath)
        blob = await resp.blob()
      } else {
        const dataUrl = await window.api.readImageAsDataURL(img.filePath)
        if (!dataUrl) continue
        blob = dataURLtoBlob(dataUrl)
      }
      await questionStore.addQuestion({
        categoryId: uncategorizedId,
        imageData: blob,
        imageName: img.fileName,
        imageSize: img.size,
        imageType: blob.type,
        correctAnswer: batchAnswer.value,
        myAnswer: '',
        notes: batchNotes.value,
        isMastered: false,
        masteredAt: null,
        wrongCount: 0
      })
    }

    scanResult.value = null
    thumbnails.value = {}
    pasteCategoryId.value = 0
    pasteNewCategoryName.value = ''
    imageCategoryId.value = 0
    imageNewCategoryName.value = ''
    isImageSelection.value = false
    batchAnswer.value = ''
    batchNotes.value = ''
    router.push('/categories')
  } finally {
    importing.value = false
  }
}

function dataURLtoBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const byteString = atob(data)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }
  return new Blob([arrayBuffer], { type: mime })
}
</script>

<style scoped>
.import-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.import-options-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.paste-zone {
  cursor: pointer;
  transition: all var(--transition);
}

.paste-zone:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.paste-zone.paste-active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.paste-hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-success);
  font-weight: 500;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.scan-category {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 12px;
}

.scan-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 14px;
}

.scan-category-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-select {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  color: var(--color-text);
}

.paste-category-input {
  margin-bottom: 10px;
}

.answer-notes-section {
  max-width: 500px;
}

.form-group {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.scan-thumbs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.scan-thumb {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.scan-thumb:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.scan-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.scan-thumb-more {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-text-muted);
  background: var(--color-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
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

.lightbox-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.lightbox-filename {
  margin-top: 12px;
  color: #fff;
  font-size: 14px;
  opacity: 0.8;
}
</style>
