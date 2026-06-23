import { contextBridge, ipcRenderer } from 'electron'

export interface Api {
  selectFolder: () => Promise<string | null>
  selectImages: () => Promise<string[] | null>
  saveFile: (defaultName: string) => Promise<string | null>
  openFile: () => Promise<string | null>

  scanFolder: (folderPath: string) => Promise<{
    categories: Array<{ name: string; images: Array<{ fileName: string; filePath: string; size: number }> }>
    uncategorized: Array<{ fileName: string; filePath: string; size: number }>
  }>
  readImageAsDataURL: (filePath: string) => Promise<string | null>
  copyFile: (srcPath: string) => Promise<string | null>
  readDir: (dirPath: string) => Promise<Array<{ name: string; isDirectory: boolean; isFile: boolean }>>

  getPath: (name: string) => Promise<string>

  exportData: (filePath: string, data: string) => Promise<boolean>
  importData: (filePath: string) => Promise<string | null>

  onMenuImportFolder: (callback: () => void) => () => void
}

const api: Api = {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectImages: () => ipcRenderer.invoke('dialog:selectImages'),
  saveFile: (defaultName: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  scanFolder: (folderPath: string) => ipcRenderer.invoke('fs:scanFolder', folderPath),
  readImageAsDataURL: (filePath: string) => ipcRenderer.invoke('fs:readImageAsDataURL', filePath),
  copyFile: (srcPath: string) => ipcRenderer.invoke('fs:copyFile', srcPath),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),

  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),

  exportData: (filePath: string, data: string) => ipcRenderer.invoke('app:exportData', filePath, data),
  importData: (filePath: string) => ipcRenderer.invoke('app:importData', filePath),

  onMenuImportFolder: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('menu:importFolder', handler)
    return () => {
      ipcRenderer.removeListener('menu:importFolder', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
