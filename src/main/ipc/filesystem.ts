import { ipcMain } from 'electron'
import { readFile, writeFile, copyFile as fsCopyFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename, extname } from 'path'
import { scanFolder } from '../utils/scanFolder'
import { app } from 'electron'

interface ImageInfo {
  fileName: string
  filePath: string
  size: number
}

interface CategoryResult {
  name: string
  images: ImageInfo[]
}

interface ScanResult {
  categories: CategoryResult[]
  uncategorized: ImageInfo[]
}

export function registerFilesystemHandlers(): void {
  ipcMain.handle('fs:scanFolder', async (_event, folderPath: string): Promise<ScanResult> => {
    return await scanFolder(folderPath)
  })

  ipcMain.handle('fs:readImageAsDataURL', async (_event, filePath: string): Promise<string | null> => {
    try {
      const ext = extname(filePath).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp'
      }
      const mime = mimeMap[ext] || 'image/png'
      const buffer = await readFile(filePath)
      const base64 = buffer.toString('base64')
      return `data:${mime};base64,${base64}`
    } catch {
      return null
    }
  })

  ipcMain.handle('fs:copyFile', async (_event, srcPath: string): Promise<string | null> => {
    try {
      const userDataPath = app.getPath('userData')
      const imagesDir = join(userDataPath, 'images')
      if (!existsSync(imagesDir)) {
        await mkdir(imagesDir, { recursive: true })
      }
      const fileName = basename(srcPath)
      const destPath = join(imagesDir, fileName)

      let finalDest = destPath
      let counter = 1
      while (existsSync(finalDest)) {
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
        const ext = extname(fileName)
        finalDest = join(imagesDir, `${nameWithoutExt}_${counter}${ext}`)
        counter++
      }

      await fsCopyFile(srcPath, finalDest)
      return finalDest
    } catch {
      return null
    }
  })

  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    try {
      const { readdir } = await import('fs/promises')
      const entries = await readdir(dirPath, { withFileTypes: true })
      return entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile()
      }))
    } catch {
      return []
    }
  })

  ipcMain.handle('app:exportData', async (_event, filePath: string, data: string): Promise<boolean> => {
    try {
      await writeFile(filePath, data, 'utf-8')
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('app:importData', async (_event, filePath: string): Promise<string | null> => {
    try {
      return await readFile(filePath, 'utf-8')
    } catch {
      return null
    }
  })

  ipcMain.handle('app:getPath', async (_event, name: string): Promise<string> => {
    return app.getPath(name as any)
  })
}
