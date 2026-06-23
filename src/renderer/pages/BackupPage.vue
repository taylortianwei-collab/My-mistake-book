<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ $t('backup.title') }}</h1>
    </div>

    <div class="backup-options">
      <div class="card">
        <h3 style="margin-bottom: 12px">{{ $t('backup.exportTitle') }}</h3>
        <p style="color: var(--color-text-secondary); margin-bottom: 16px; font-size: 14px">
          {{ $t('backup.exportDesc') }}
        </p>
        <button class="btn btn-primary" @click="exportData" :disabled="exporting">
          {{ exporting ? $t('backup.exporting') : $t('backup.exportBtn') }}
        </button>
        <div v-if="exportSuccess" class="success-msg">{{ $t('backup.exportSuccess') }}</div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 12px">{{ $t('backup.importTitle') }}</h3>
        <p style="color: var(--color-text-secondary); margin-bottom: 16px; font-size: 14px">
          {{ $t('backup.importDesc') }}
        </p>
        <button class="btn btn-secondary" @click="importData" :disabled="importing">
          {{ importing ? $t('backup.importing') : $t('backup.importBtn') }}
        </button>
        <div v-if="importSuccess" class="success-msg">{{ $t('backup.importSuccess') }}</div>
        <div v-if="importError" class="error-msg">{{ importError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { db } from '../db/database'

const { t } = useI18n()

const exporting = ref(false)
const exportSuccess = ref(false)
const importing = ref(false)
const importSuccess = ref(false)
const importError = ref('')

async function exportData() {
  exporting.value = true
  exportSuccess.value = false
  try {
    const rawQuestions = await db.questions.toArray()
    const questions = await Promise.all(rawQuestions.map(async q => ({
      ...q,
      imageData: q.imageData ? await blobToBase64(q.imageData) : null
    })))

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: await db.categories.toArray(),
      questions,
      quizSessions: await db.quizSessions.toArray(),
      quizAnswers: await db.quizAnswers.toArray()
    }

    const json = JSON.stringify(data)
    const date = new Date().toISOString().slice(0, 10)
    const defaultName = `${t('backup.backupFileName')}_${date}.json`
    const filePath = await window.api.saveFile(defaultName)

    if (filePath) {
      await window.api.exportData(filePath, json)
      exportSuccess.value = true
    }
  } catch (e) {
    console.error('Export failed:', e)
  } finally {
    exporting.value = false
  }
}

async function importData() {
  importing.value = true
  importSuccess.value = false
  importError.value = ''
  try {
    const filePath = await window.api.openFile()
    if (!filePath) return

    const json = await window.api.importData(filePath)
    if (!json) {
      importError.value = t('backup.cannotReadFile')
      return
    }

    const data = JSON.parse(json)
    if (!data.version || !data.categories || !data.questions) {
      importError.value = t('backup.invalidFormat')
      return
    }

    await db.transaction('rw', [db.categories, db.questions, db.quizSessions, db.quizAnswers], async () => {
      await db.categories.clear()
      await db.questions.clear()
      await db.quizSessions.clear()
      await db.quizAnswers.clear()

      // Build old→new category ID mapping
      const categoryIdMap = new Map<number, number>()
      for (const cat of data.categories) {
        const { id, ...catData } = cat
        const newId = await db.categories.add(catData)
        if (id) categoryIdMap.set(id, newId as number)
      }

      for (const q of data.questions) {
        const { id, categoryId: oldCategoryId, imageData, ...qData } = q
        const newCategoryId = categoryIdMap.get(oldCategoryId) || oldCategoryId
        const blob = imageData ? base64ToBlob(imageData) : new Blob()
        await db.questions.add({ ...qData, categoryId: newCategoryId, imageData: blob })
      }

      if (data.quizSessions) {
        const sessionIdMap = new Map<number, number>()
        for (const s of data.quizSessions) {
          const { id, ...sData } = s
          const newId = await db.quizSessions.add(sData)
          if (id) sessionIdMap.set(id, newId as number)
        }

        if (data.quizAnswers) {
          for (const a of data.quizAnswers) {
            const { id, sessionId: oldSessionId, ...aData } = a
            const newSessionId = sessionIdMap.get(oldSessionId) || oldSessionId
            await db.quizAnswers.add({ ...aData, sessionId: newSessionId })
          }
        }
      }
    })

    importSuccess.value = true
  } catch (e: any) {
    importError.value = e.message || t('backup.importFailed')
  } finally {
    importing.value = false
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',')
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
.backup-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 700px;
}

.success-msg {
  margin-top: 10px;
  color: var(--color-success);
  font-weight: 500;
  font-size: 14px;
}

.error-msg {
  margin-top: 10px;
  color: var(--color-error);
  font-weight: 500;
  font-size: 14px;
}
</style>
