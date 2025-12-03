# 📘 IELTS Learning App

An AI-powered learning application designed for **IELTS exam preparation**, covering core skills such as writing, reading, speaking, vocabulary, and language expression to help self-learners improve systematically.
- English: README.md
- 中文版: [README_zh.md](README_zh.md)
---

## notice
- only implement deepseek API

## 🖼 Screenshots

### Home Page
![Home Page](screenshot/en.png)

## ✨ Product Overview

IELTS Learning App is a **front-end and back-end separated** English learning tool:

- 🎯 Focused on real IELTS exam scenarios  
- 🤖 AI-assisted writing, rewriting, summarization, and language enhancement  
- 🧩 Modular feature design organized by skill areas  
- 🌏 Supports both Chinese and English interfaces  
- ⚙️ Initial setup requires API configuration in the Settings page  

---

## 🧠 Feature Modules

### ✍️ Writing

- **Writing Task 1**
  - Chart and data description writing
  - Sample generation, structure guidance, and language rewriting
- **Writing Task 2**
  - Argumentative essay practice
  - Idea expansion, sentence upgrading, and expression optimization

---

### 📖 Reading

- **Reading 1 / 2 / 3**
  - Progressive difficulty reading practice
  - Simulated IELTS-style questions
  - Reading comprehension and analysis support

---

### 🗣 Speaking

- Topic-based speaking practice
- Guided idea development
- Suitable for IELTS Speaking Part 1 / Part 2 / Part 3

---

### 🧩 Language Skill Training

- **Sentence Translation**: Chinese–English translation practice  
- **Synonym Hunter**: Synonym and paraphrase expansion  
- **Sentence Imitation**: High-scoring sentence pattern practice  
- **Sentence Upgrade**: Sentence refinement and academic enhancement  
- **Paragraph Imitation**: Paragraph structure learning  
- **Article Summary**: Article summarization training  

---

### ⚙️ System Features

- ✅ Automatic configuration status check on startup  
- 🔐 Automatically redirects to the Settings page if not configured  
- 🌐 One-click Chinese / English language switching  
- 📮 Contact page  

---

## 🖥 Frontend Tech Stack

- React + Vite  
- Tailwind CSS  
- lucide-react (icons)  
- sonner (toast notifications)  
- React Hooks for state management  

---

## 🚀 Frontend Installation & Startup

### Requirements

- Node.js >= 18
- npm / pnpm / yarn

### Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

## 🚀 Backend Installation & Startup
```bash
python -m venv venv
source venv/bin/activate   # macOS / Linux
venv\Scripts\activate      # 

pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload

http://localhost:8000
```