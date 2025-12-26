# 📄 SummarizerBuddy

SummarizerBuddy is a full-stack web application that allows users to **paste text**, **generate summaries**, and **ask questions about the pasted document** using AI.  
No file uploads are required — everything works directly from pasted text.

---

## ✨ Features

- Paste any document or text
- Generate summaries in multiple formats:
  - Short
  - Detailed
  - Bullet points
- Choose explanation level:
  - 12-year-old
  - College student
  - Expert
- Ask questions about the pasted document
- Automatic document understanding before answering questions
- Uses Retrieval-Augmented Generation (RAG) for accurate answers

---

## 🧠 How It Works

1. User pastes a document into the text area  
2. The document is split into chunks  
3. Each chunk is converted into embeddings  
4. When a question is asked:
   - The question is embedded
   - The most relevant document chunks are retrieved
   - The AI answers using **only the retrieved document content**

The document is stored **in memory only** and is not saved to disk or a database.

---

## 🛠 Tech Stack

### Frontend
- React / Next.js
- Tailwind CSS
- Fetch API

### Backend
- Node.js
- Express
- OpenAI API
- In-memory vector storage (no database)

---

## 🚀 Getting Started

### 1️⃣ Backend Setup

```bash
cd server
npm install
