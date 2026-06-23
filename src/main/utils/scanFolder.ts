import { readdir } from 'fs/promises'
import { statSync } from 'fs'
import { join, extname } from 'path'

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

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])

function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(extname(fileName).toLowerCase())
}

async function collectImages(dirPath: string): Promise<ImageInfo[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const images: ImageInfo[] = []

  for (const entry of entries) {
    if (entry.isFile() && isImageFile(entry.name)) {
      try {
        const fullPath = join(dirPath, entry.name)
        const stats = statSync(fullPath)
        images.push({
          fileName: entry.name,
          filePath: fullPath,
          size: stats.size
        })
      } catch {
          continue
      }
    } else if (entry.isDirectory() && entry.name !== '.DS_Store') {
      const subImages = await collectImages(join(dirPath, entry.name))
      images.push(...subImages)
    }
  }

  return images
}

/**
 * Scan a folder and return its structure:
 * - Top-level subdirectories are treated as categories
 * - Top-level image files are treated as uncategorized
 * - Nested images inside category folders are collected recursively
 */
export async function scanFolder(folderPath: string): Promise<ScanResult> {
  const entries = await readdir(folderPath, { withFileTypes: true })

  const categories: CategoryResult[] = []
  const uncategorized: ImageInfo[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    const fullPath = join(folderPath, entry.name)

    if (entry.isDirectory()) {
      const images = await collectImages(fullPath)
      categories.push({
        name: entry.name,
        images
      })
    } else if (entry.isFile() && isImageFile(entry.name)) {
      try {
        const stats = statSync(fullPath)
        uncategorized.push({
          fileName: entry.name,
          filePath: fullPath,
          size: stats.size
        })
      } catch {
        continue
      }
    }
  }

  categories.sort((a, b) => a.name.localeCompare(b.name))
  for (const cat of categories) {
    cat.images.sort((a, b) => a.fileName.localeCompare(b.fileName))
  }
  uncategorized.sort((a, b) => a.fileName.localeCompare(b.fileName))

  return { categories, uncategorized }
}
