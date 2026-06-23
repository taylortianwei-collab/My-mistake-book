# 📝 错题本 - 智能错题管理工具

一款专为学生和家长设计的桌面错题管理应用，支持图片导入、分类管理、智能刷题和数据备份。

![Electron](https://img.shields.io/badge/Electron-33.4.11-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3.5.13-4FC08D?logo=vuedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)

## ✨ 功能特性

### 📥 多种导入方式
- **文件夹扫描** - 自动识别子文件夹结构，一键批量导入
- **选择图片** - 手动选择单张或多张图片
- **粘贴截图** - 支持剪贴板粘贴，适合截图后直接导入

### 🎯 智能分类管理
- 创建多个分类，自定义图标
- **拖拽归类** - 左侧预览，右侧分类，拖拽即可移动
- 支持选择批量删除

### ✏️ 刷题练习
- 选择任意分类进行刷题
- 随机排序，防止记忆答案
- 答案不区分大小写
- **已掌握标记** - 会的题目移入「已掌握」分类

### 💾 数据安全
- JSON 格式导出备份
- 一键恢复所有数据
- 分类、题目、刷题记录完整保留

### 🌐 多语言支持
- 中文 / English 一键切换

## 📦 下载安装

### macOS
- **Apple Silicon (M1/M2/M3)**: [下载 .dmg](../../releases/latest) (94MB)
- **Intel**: [下载 .dmg](../../releases/latest) (98MB)

### Windows
- **Windows**: [下载 .exe](../../releases/latest) (83MB)

## 🚀 开发环境

### 环境要求
- Node.js 20+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发模式
```bash
npm run dev
```

### 构建安装包
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# 全部
npm run build
```

## 📁 项目结构

```
mistake-book/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts
│   │   ├── ipc/           # IPC 通信处理
│   │   └── utils/         # 工具函数
│   ├── preload/           # 预加载脚本
│   └── renderer/          # Vue 3 前端
│       ├── pages/         # 页面组件
│       ├── stores/        # Pinia 状态管理
│       ├── db/            # Dexie.js 数据库
│       ├── locales/       # 国际化语言包
│       └── styles/        # 全局样式
├── package.json
└── electron.vite.config.ts
```

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Electron | 桌面应用框架 |
| Vue 3 | 前端 UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Dexie.js | IndexedDB 封装 |
| Pinia | 状态管理 |
| Vue Router | 路由管理 |
| vue-i18n | 国际化 |

## 📸 使用场景

- 📚 整理日常作业错题
- 📝 考试后批量导入错题
- 🎯 针对薄弱知识点刷题
- 📊 跟踪学习进度

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
