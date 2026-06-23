# 📝 Mistake Book - Smart Error Tracking Tool

A desktop application designed for students and parents to manage wrong answers from tests and homework. Import images, organize by category, practice with quizzes, and backup your data.

![Electron](https://img.shields.io/badge/Electron-33.4.11-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3.5.13-4FC08D?logo=vuedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)

## ✨ Features

### 📥 Multiple Import Methods
- **Folder Scan** - Automatically detect subfolder structure, bulk import with one click
- **Select Images** - Manually select single or multiple images
- **Paste Screenshots** - Support clipboard paste, perfect for importing right after taking a screenshot

### 🎯 Smart Category Management
- Create multiple categories with custom icons
- **Drag & Drop** - Preview on left, categories on right, drag to organize
- Batch select and delete

### ✏️ Quiz Practice
- Select any category to practice
- Random order to prevent memorizing answers
- Case-insensitive answer checking
- **Mark as Mastered** - Move completed questions to "Mastered" category

### 💾 Data Safety
- Export backup in JSON format
- One-click restore all data
- Categories, questions, and quiz history fully preserved

### 🌐 Multi-language Support
- Switch between 中文 (Chinese) and English

## 📦 Download

### macOS
- **Apple Silicon (M1/M2/M3)**: [Download .dmg](../../releases/latest) (94MB)
- **Intel**: [Download .dmg](../../releases/latest) (98MB)

### Windows
- **Windows**: [Download .exe](../../releases/latest) (83MB)

## 🚀 Development

### Requirements
- Node.js 20+
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Start Dev Mode
```bash
npm run dev
```

### Build Installers
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# All platforms
npm run build
```

## 📁 Project Structure

```
mistake-book/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts
│   │   ├── ipc/           # IPC handlers
│   │   └── utils/         # Utilities
│   ├── preload/           # Preload scripts
│   └── renderer/          # Vue 3 frontend
│       ├── pages/         # Page components
│       ├── stores/        # Pinia state management
│       ├── db/            # Dexie.js database
│       ├── locales/       # i18n language files
│       └── styles/        # Global styles
├── package.json
└── electron.vite.config.ts
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Electron | Desktop app framework |
| Vue 3 | Frontend UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Dexie.js | IndexedDB wrapper |
| Pinia | State management |
| Vue Router | Routing |
| vue-i18n | Internationalization |

## 📸 Use Cases

- 📚 Organize daily homework mistakes
- 📝 Bulk import after exams
- 🎯 Practice weak topics
- 📊 Track learning progress

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
