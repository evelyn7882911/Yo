# 🌳 Hierarchical Fold Editor

> A tree-based custom editor for VS Code with modal editing, intelligent folding, and ultra-fast navigation.

![License](https://img.shields.io/badge/license-MIT-green)
![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue)
![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178C6)

---

## ✨ Overview

Hierarchical Fold Editor is a custom VS Code editor designed for structured text files (`.tree`).  
It provides tree-based editing, modal navigation, bookmarks, and performance-optimized rendering for large documents.

Built for:
- 🧠 Knowledge workers
- ✍️ Writers
- 💻 Developers
- 📚 Researchers
- 🗂 Structured note-takers

---

## 🚀 Features

### 🌲 Tree-Based Editing
- Structured node system
- Expand / collapse hierarchy
- Fast navigation across nodes

### ⌨️ Modal Editing (Vim-Inspired)
- Normal mode
- Insert mode
- Leader key system
- Fast structural movement

### 🔖 Bookmark System
- Add bookmarks to nodes
- Quick jump navigation
- Persistent within document

### 🔎 Smart Filtering
- Search auto-expands matches
- Focus mode for filtered results

### 🗺 Minimap & Virtual Scrolling
- Smooth performance on large files
- Efficient rendering
- Optimized scroll behavior

### 🧘 Zen Mode
- Distraction-free editing
- Clean structured writing view

---

## 🖼 Preview

> *(Add screenshots or GIF demo here)*
assets/demo.gif assets/screenshot1.png
Salin kode

---

## 📦 Installation (Development)

```bash
git clone https://github.com/yourusername/hierarchical-fold-editor.git
cd hierarchical-fold-editor
npm install
cd webview
npm install
npm run build
cd ..
npm run compile
Press:
Salin kode

F5
To launch Extension Development Host.
📂 File Type
The editor activates on:
Salin kode

.tree
Example:
Salin kode

Root
  Child A
    Subchild A1
  Child B
⚙️ Configuration
Setting
Description
Default
hierarchicalFoldEditor.leaderKey
Leader key for commands
Space
hierarchicalFoldEditor.autoReveal
Auto reveal active node
true
hierarchicalFoldEditor.zenMode
Start in Zen mode
false
🧠 Architecture
VS Code Custom Editor API
Webview (React + Vite)
TypeScript
Virtual rendering system
Modular core logic
Project Structure:
Salin kode

src/
  extension.ts
  editorProvider.ts
  core.ts
  types.ts
  utils.ts

webview/
  components.tsx
  hooks.ts
  main.tsx
🛣 Roadmap
[ ] Undo/Redo stack improvement
[ ] Multi-file workspace support
[ ] Drag & drop node reordering
[ ] Import/export Markdown
[ ] VS Code Marketplace release
🤝 Contributing
Contributions are welcome.
Fork the repo
Create feature branch
Commit changes
Open pull request
📄 License
MIT License © 2026 Paong
🌟 Why This Project?
This is not just a folding extension.
It is a structured editing engine built for clarity, speed, and scalable thinking.
If you like structured writing and tree-based navigation, this extension is designed for you